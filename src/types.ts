export type ProductCategory = 
  | 'Ultra Series' 
  | 'Juiced Series' 
  | 'Nitro Series' 
  | 'Motorsport Edition' 
  | 'Classic Core' 
  | 'Heritage Series';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  sku: string;
  flavorProfile: string;
  accentColor: string;
  badgeColor: string;
  stock: number;
  totalSold: number;
  stockReceived: number;
  lowStockThreshold: number;
  unitPrice: number;
  costPrice: number;
  canSize: string;
  updatedAt: string;
}

export interface SaleTransaction {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'Digital Pay' | 'Invoice';
  customerNotes?: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  isReversed: boolean;
  reversedAt?: string;
  reversedBy?: string;
}

export interface ActivityLog {
  id: string;
  type: 'sale' | 'restock' | 'damage' | 'adjustment' | 'reversal' | 'user_register' | 'settings_change';
  productId?: string;
  productName?: string;
  quantityChanged: number;
  resultingStock?: number;
  reason: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  avatarColor: string;
  createdAt: string;
  lastLoginAt: string;
  salesCount?: number;
  unitsSold?: number;
  totalRevenue?: number;
}

export interface StoreSettings {
  storeName: string;
  defaultLowStockThreshold: number;
  currencySymbol: string;
  canUnitVolume: string;
  soundAlertsEnabled: boolean;
}

export interface InventoryStats {
  totalStock: number;
  totalUnitsSold: number;
  totalTransactions: number;
  totalRevenue: number;
  dailyRevenue: number;
  dailyUnits: number;
  weeklyRevenue: number;
  weeklyUnits: number;
  monthlyRevenue: number;
  monthlyUnits: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  bestSeller: {
    id: string;
    name: string;
    totalSold: number;
  } | null;
}
