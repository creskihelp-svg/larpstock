import React, { useState, useEffect, useCallback } from 'react';
import { Product, SaleTransaction, ActivityLog, User, StoreSettings, InventoryStats } from './types';
import { api, realtimeSync } from './services/api';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { RecordSaleView } from './components/RecordSaleView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { TeamView } from './components/TeamView';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { Sparkles, AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function App() {
  // Core application state
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalStock: 0,
    totalUnitsSold: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    dailyRevenue: 0,
    dailyUnits: 0,
    weeklyRevenue: 0,
    weeklyUnits: 0,
    monthlyRevenue: 0,
    monthlyUnits: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    bestSeller: null,
  });
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'MONSTER STOCK MANAGER',
    defaultLowStockThreshold: 5,
    currencySymbol: '$',
    canUnitVolume: '500ml',
    soundAlertsEnabled: true,
  });
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Navigation & UI state
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [preselectedProductForSale, setPreselectedProductForSale] = useState<Product | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Toast notification
  const [toast, setToast] = useState<{
    title: string;
    message: string;
    type: 'success' | 'alert' | 'info';
  } | null>(null);

  const showToast = useCallback((title: string, message: string, type: 'success' | 'alert' | 'info' = 'info') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Acoustic feedback synthesis using Web Audio API
  const playSound = useCallback((type: 'sale' | 'restock' | 'alert') => {
    if (!settings.soundAlertsEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'sale') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'restock') {
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.2); // E5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Audio autoplay may be constrained until user interaction
    }
  }, [settings.soundAlertsEnabled]);

  // Load all initial data from backend
  const refreshAllData = useCallback(async () => {
    try {
      const [invData, salesData, logsData, usersData] = await Promise.all([
        api.getInventory(),
        api.getSales(),
        api.getLogs(),
        api.getUsers(),
      ]);

      setProducts(invData.products);
      setStats(invData.stats);
      if (invData.settings) setSettings(invData.settings);
      setSales(salesData);
      setLogs(logsData);
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load initial inventory data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch current user or fallback
  useEffect(() => {
    async function initUser() {
      try {
        const user = await api.getCurrentUser();
        setCurrentUser(user);
      } catch {
        // Fallback to demo login if first time
        const cached = api.getCachedUser();
        if (cached) {
          setCurrentUser(cached);
        } else {
          try {
            const loginRes = await api.login('admin@monster.energy', 'Monster2026!');
            setCurrentUser(loginRes.user);
          } catch (e) {
            console.warn('Initial auth fallback:', e);
          }
        }
      }
    }
    initUser();
    refreshAllData();
  }, [refreshAllData]);

  // Real-time Cloud Synchronisation Subscription
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((event, data) => {
      if (event === 'SYNC_CONNECTED') {
        setIsSynced(true);
      } else if (event === 'SYNC_DISCONNECTED') {
        setIsSynced(false);
      } else if (event === 'SALE_RECORDED') {
        // Live Sale Event broadcasted from any device!
        const { product, sale, log, stats: newStats } = data;
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? product : p))
        );
        setSales((prev) => [sale, ...prev]);
        if (log) setLogs((prev) => [log, ...prev]);
        if (newStats) setStats(newStats);

        playSound('sale');
        showToast(
          '⚡ Live Sale Synchronised',
          `${sale.userName} recorded ${sale.quantity}x ${sale.productName}. Stock is now ${product.stock}.`,
          'success'
        );
      } else if (event === 'SALE_REVERSED') {
        const { sale, product, log, stats: newStats } = data;
        setSales((prev) =>
          prev.map((s) => (s.id === sale.id ? sale : s))
        );
        if (product) {
          setProducts((prev) =>
            prev.map((p) => (p.id === product.id ? product : p))
          );
        }
        if (log) setLogs((prev) => [log, ...prev]);
        if (newStats) setStats(newStats);

        showToast(
          '⚡ Transaction Reversed',
          `Order ${sale.id} reversed. Stock restored to ${product?.stock || 'inventory'}.`,
          'info'
        );
      } else if (event === 'STOCK_UPDATED') {
        const { product, log, stats: newStats, action } = data;
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? product : p))
        );
        if (log) setLogs((prev) => [log, ...prev]);
        if (newStats) setStats(newStats);

        if (action === 'restock') {
          playSound('restock');
          showToast('⚡ Stock Added', `${product.name} restocked to ${product.stock} cans.`, 'success');
        } else if (action === 'damage') {
          playSound('alert');
          showToast('⚡ Damaged Stock Written Off', `${product.name} stock adjusted to ${product.stock} cans.`, 'alert');
        } else {
          showToast('⚡ Inventory Updated', `${product.name} calibrated to ${product.stock} cans.`, 'info');
        }
      } else if (event === 'SETTINGS_UPDATED') {
        const { settings: newSettings, stats: newStats } = data;
        if (newSettings) setSettings(newSettings);
        if (newStats) setStats(newStats);
        showToast('⚡ Settings Updated', 'System preferences synchronized across devices.', 'info');
      } else if (event === 'USER_JOINED') {
        api.getUsers().then(setUsers);
        showToast('⚡ New Team Member', `${data.user.name} joined the Monster Stock team.`, 'info');
      } else if (event === 'CATALOG_RESET') {
        refreshAllData();
        showToast('⚡ Catalogue Reset', 'Reset to 23 default flavours.', 'info');
      }
    });

    return () => unsubscribe();
  }, [playSound, showToast, refreshAllData]);

  // Actions
  const handleRecordSale = async (payload: {
    productId: string;
    quantity: number;
    paymentMethod: string;
    customerNotes?: string;
  }) => {
    const res = await api.recordSale(payload);
    setProducts((prev) =>
      prev.map((p) => (p.id === res.product.id ? res.product : p))
    );
    setSales((prev) => [res.sale, ...prev]);
    setStats(res.stats);
  };

  const handleReverseSale = async (saleId: string, reason?: string) => {
    const res = await api.reverseSale(saleId, reason);
    setSales((prev) =>
      prev.map((s) => (s.id === res.sale.id ? res.sale : s))
    );
    if (res.product) {
      setProducts((prev) =>
        prev.map((p) => (p.id === res.product.id ? res.product : p))
      );
    }
    setStats(res.stats);
  };

  const handleRestock = async (productId: string, quantity: number, notes?: string, supplierBatch?: string) => {
    const res = await api.restock({ productId, quantity, notes, supplierBatch });
    setProducts((prev) =>
      prev.map((p) => (p.id === res.product.id ? res.product : p))
    );
    setLogs((prev) => [res.log, ...prev]);
    setStats(res.stats);
  };

  const handleDamage = async (productId: string, quantity: number, reason?: string) => {
    const res = await api.recordDamage({ productId, quantity, reason });
    setProducts((prev) =>
      prev.map((p) => (p.id === res.product.id ? res.product : p))
    );
    setLogs((prev) => [res.log, ...prev]);
    setStats(res.stats);
  };

  const handleAdjust = async (productId: string, newStock: number, reason?: string) => {
    const res = await api.adjustStock({ productId, newStock, reason });
    setProducts((prev) =>
      prev.map((p) => (p.id === res.product.id ? res.product : p))
    );
    setLogs((prev) => [res.log, ...prev]);
    setStats(res.stats);
  };

  const handleUpdateProductDetails = async (productId: string, updates: Partial<Product>) => {
    const res = await api.updateProduct(productId, updates);
    setProducts((prev) =>
      prev.map((p) => (p.id === res.product.id ? res.product : p))
    );
    setStats(res.stats);
  };

  const handleUpdateSettings = async (newSettings: Partial<StoreSettings>) => {
    const res = await api.updateSettings(newSettings);
    setSettings(res.settings);
  };

  const handleResetCatalog = async () => {
    await api.resetCatalog();
    await refreshAllData();
  };

  const handleClearAllValues = async () => {
    await api.clearAllValues();
    await refreshAllData();
  };

  const handleLogin = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setCurrentUser(res.user);
    showToast('Signed In', `Welcome back, ${res.user.name}!`, 'success');
  };

  const handleRegister = async (name: string, email: string, pass: string, role: 'admin' | 'staff') => {
    const res = await api.register(name, email, pass, role);
    setCurrentUser(res.user);
    const updatedUsers = await api.getUsers();
    setUsers(updatedUsers);
    showToast('Account Created', `Registered ${res.user.name} as ${role}.`, 'success');
  };

  const handleLogout = () => {
    api.clearToken();
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  // Quick switch role for easy testing directly from header
  const handleQuickSwitchUser = async (role: 'admin' | 'staff') => {
    try {
      const email = role === 'admin' ? 'admin@monster.energy' : 'staff@monster.energy';
      const res = await api.login(email, 'Monster2026!');
      setCurrentUser(res.user);
      showToast('Switched Account', `Now operating as ${res.user.name} (${res.user.role.toUpperCase()})`, 'info');
    } catch (e) {
      console.warn('Switch user error:', e);
    }
  };

  // Switch to specific user card from Team page
  const handleSwitchToUser = async (user: User) => {
    try {
      // Login with standard demo password
      const res = await api.login(user.email, 'Monster2026!');
      setCurrentUser(res.user);
      showToast('Session Active', `Switched to ${user.name}`, 'info');
    } catch {
      setCurrentUser(user);
    }
  };

  // Calculate low stock alert count
  const lowStockAlertCount = products.filter(
    (p) => p.stock <= (p.lowStockThreshold || settings.defaultLowStockThreshold)
  ).length;

  return (
    <div className="min-h-screen bg-[#08090a] text-zinc-100 flex flex-col selection:bg-[#00ff41] selection:text-black claw-bg">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-16 right-4 z-50 max-w-sm w-full p-4 rounded-xl bg-[#121518]/95 backdrop-blur-md border border-emerald-500/60 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-950 text-[#00ff41] mt-0.5">
              {toast.type === 'alert' ? (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#00ff41]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-xs text-white uppercase font-mono">{toast.title}</h5>
              <p className="text-xs text-zinc-300 mt-0.5 leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-zinc-500 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        currentUser={currentUser}
        isSynced={isSynced}
        onOpenUserModal={() => setIsAuthModalOpen(true)}
        onOpenSetupGuide={() => setCurrentTab('settings')}
        onQuickSwitchUser={handleQuickSwitchUser}
        lowStockAlertCount={lowStockAlertCount}
      />

      {/* Top Desktop Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        lowStockCount={lowStockAlertCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-4">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="w-12 h-12 rounded-xl border-2 border-[#00ff41] border-t-transparent animate-spin mx-auto mb-4 glow-green" />
            <p className="font-mono text-sm text-emerald-400 font-bold uppercase tracking-widest">
              Connecting to Monster Cloud Database...
            </p>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                products={products}
                recentSales={sales}
                recentLogs={logs}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onQuickRestock={(product) => {
                  setPreselectedProductForSale(product);
                  setCurrentTab('inventory');
                }}
                currencySymbol={settings.currencySymbol}
              />
            )}

            {currentTab === 'inventory' && (
              <InventoryView
                products={products}
                onRestock={handleRestock}
                onDamage={handleDamage}
                onAdjust={handleAdjust}
                onUpdateDetails={handleUpdateProductDetails}
                onSelectForSale={(product) => {
                  setPreselectedProductForSale(product);
                  setCurrentTab('record-sale');
                }}
                currencySymbol={settings.currencySymbol}
              />
            )}

            {currentTab === 'record-sale' && (
              <RecordSaleView
                products={products}
                onConfirmSale={handleRecordSale}
                preselectedProduct={preselectedProductForSale}
                recentSales={sales}
                currencySymbol={settings.currencySymbol}
              />
            )}

            {currentTab === 'sales-history' && (
              <SalesHistoryView
                sales={sales}
                onReverseSale={handleReverseSale}
                currencySymbol={settings.currencySymbol}
              />
            )}

            {currentTab === 'team' && (
              <TeamView
                users={users}
                currentUser={currentUser}
                onRegisterUser={handleRegister}
                onSwitchUser={handleSwitchToUser}
                currencySymbol={settings.currencySymbol}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsView
                settings={settings}
                currentUser={currentUser}
                onUpdateSettings={handleUpdateSettings}
                onResetCatalog={handleResetCatalog}
                onClearAllValues={handleClearAllValues}
                isSynced={isSynced}
              />
            )}
          </>
        )}
      </main>

      {/* Auth / Account Switch Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onLogout={handleLogout}
      />
    </div>
  );
}
