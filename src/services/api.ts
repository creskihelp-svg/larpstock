import { Product, SaleTransaction, ActivityLog, User, StoreSettings, InventoryStats } from '../types';

const TOKEN_KEY = 'monster_stock_token';
const USER_KEY = 'monster_stock_user';

export const api = {
  getToken(): string {
    return localStorage.getItem(TOKEN_KEY) || 'session-admin-demo';
  },

  setToken(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCachedUser(): User | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorMsg = `HTTP error ${res.status}`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.error || errorMsg;
      } catch {
        // ignore json parse error
      }
      throw new Error(errorMsg);
    }

    return res.json() as Promise<T>;
  },

  // Auth methods
  async getCurrentUser(): Promise<User> {
    const data = await this.request<{ user: User }>('/api/auth/me');
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token, data.user);
    return data;
  },

  async register(name: string, email: string, password: string, role: 'admin' | 'staff' = 'staff'): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    this.setToken(data.token, data.user);
    return data;
  },

  async getUsers(): Promise<User[]> {
    const data = await this.request<{ users: User[] }>('/api/users');
    return data.users;
  },

  // Inventory & Sales
  async getInventory(): Promise<{ products: Product[]; stats: InventoryStats; settings: StoreSettings }> {
    return this.request<{ products: Product[]; stats: InventoryStats; settings: StoreSettings }>('/api/inventory');
  },

  async getSales(): Promise<SaleTransaction[]> {
    const data = await this.request<{ sales: SaleTransaction[] }>('/api/sales');
    return data.sales;
  },

  async getLogs(): Promise<ActivityLog[]> {
    const data = await this.request<{ logs: ActivityLog[] }>('/api/logs');
    return data.logs;
  },

  async recordSale(payload: {
    productId: string;
    quantity: number;
    paymentMethod?: string;
    customerNotes?: string;
  }): Promise<{ product: Product; sale: SaleTransaction; stats: InventoryStats }> {
    return this.request('/api/sales/record', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async reverseSale(saleId: string, reason?: string): Promise<{ sale: SaleTransaction; product: Product; stats: InventoryStats }> {
    return this.request(`/api/sales/${saleId}/reverse`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async restock(payload: {
    productId: string;
    quantity: number;
    notes?: string;
    supplierBatch?: string;
  }): Promise<{ product: Product; log: ActivityLog; stats: InventoryStats }> {
    return this.request('/api/inventory/restock', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async recordDamage(payload: {
    productId: string;
    quantity: number;
    reason?: string;
  }): Promise<{ product: Product; log: ActivityLog; stats: InventoryStats }> {
    return this.request('/api/inventory/damage', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async adjustStock(payload: {
    productId: string;
    newStock: number;
    reason?: string;
  }): Promise<{ product: Product; log: ActivityLog; stats: InventoryStats }> {
    return this.request('/api/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateProduct(id: string, payload: Partial<Product>): Promise<{ product: Product; stats: InventoryStats }> {
    return this.request(`/api/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async updateSettings(settings: Partial<StoreSettings>): Promise<{ settings: StoreSettings }> {
    return this.request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async resetCatalog(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/admin/reset-catalog', {
      method: 'POST',
    });
  },

  async clearAllValues(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/admin/clear-values', {
      method: 'POST',
    });
  },
};

// Real-Time Event Subscription using Server-Sent Events (SSE)
export type SSEEventHandler = (eventType: string, data: any) => void;

class RealtimeSyncManager {
  private eventSource: EventSource | null = null;
  private listeners: Set<SSEEventHandler> = new Set();
  private isConnected = false;
  private reconnectTimeout: any = null;

  connect() {
    if (this.eventSource) return;

    try {
      this.eventSource = new EventSource('/api/stream');

      this.eventSource.onopen = () => {
        this.isConnected = true;
        this.notify('SYNC_CONNECTED', { timestamp: new Date().toISOString() });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.event) {
            this.notify(parsed.event, parsed.data);
          }
        } catch {
          // ignore non-json messages (like heartbeats)
        }
      };

      this.eventSource.onerror = () => {
        this.isConnected = false;
        this.notify('SYNC_DISCONNECTED', {});
        this.disconnect();
        // Exponential / backoff reconnection
        this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
      };
    } catch (e) {
      console.warn('Realtime sync setup error:', e);
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected = false;
  }

  subscribe(listener: SSEEventHandler) {
    this.listeners.add(listener);
    if (!this.eventSource) {
      this.connect();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private notify(eventType: string, data: any) {
    this.listeners.forEach((fn) => {
      try {
        fn(eventType, data);
      } catch (err) {
        console.error('Listener error in realtime sync:', err);
      }
    });
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export const realtimeSync = new RealtimeSyncManager();
