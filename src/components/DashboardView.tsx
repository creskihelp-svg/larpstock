import React from 'react';
import { Product, InventoryStats, SaleTransaction, ActivityLog } from '../types';
import { MonsterCan } from './MonsterCan';
import { 
  Boxes, 
  TrendingUp, 
  Receipt, 
  Crown, 
  Calendar, 
  CalendarDays, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';

interface DashboardViewProps {
  stats: InventoryStats;
  products: Product[];
  recentSales: SaleTransaction[];
  recentLogs: ActivityLog[];
  onNavigateTab: (tab: 'inventory' | 'record-sale' | 'sales-history') => void;
  onQuickRestock: (product: Product) => void;
  currencySymbol: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  products,
  recentSales,
  recentLogs,
  onNavigateTab,
  onQuickRestock,
  currencySymbol,
}) => {
  // Find low stock & out of stock products
  const criticalProducts = products.filter(
    (p) => p.stock <= (p.lowStockThreshold || 5)
  );

  // Top 5 selling flavours
  const topFlavours = [...products].sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);

  // Group stock by Category
  const categorySummary = products.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.stock;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner Alert if low stock exists */}
      {criticalProducts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/80 via-zinc-900 to-amber-950/80 border border-amber-500/40 rounded-xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-200 uppercase tracking-wide">
                Inventory Alert: {criticalProducts.length} Monster Flavours Running Low
              </h4>
              <p className="text-xs text-zinc-300 mt-0.5">
                {criticalProducts.map((p) => `${p.name} (${p.stock} left)`).join(', ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              onClick={() => onNavigateTab('inventory')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition cursor-pointer"
            >
              Restock Now
            </button>
          </div>
        </div>
      )}

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Cans in Stock */}
        <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Total In Stock
            </span>
            <div className="p-2 rounded-lg bg-emerald-950/60 text-[#00ff41] border border-emerald-500/30">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight flex items-baseline gap-2">
              <span>{stats.totalStock}</span>
              <span className="text-xs text-zinc-400 font-sans font-normal">cans</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400 font-mono">
              <span className="text-emerald-400 font-semibold">{products.length} flavours active</span>
              <span>•</span>
              <span>Valued {currencySymbol}{stats.totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Total Cans Sold */}
        <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-4 sm:p-5 relative overflow-hidden group hover:border-[#00ff41]/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00ff41]/5 rounded-full blur-2xl group-hover:bg-[#00ff41]/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Total Cans Sold
            </span>
            <div className="p-2 rounded-lg bg-emerald-950/60 text-[#00ff41] border border-emerald-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-[#00ff41] tracking-tight flex items-baseline gap-2 glow-green-text">
              <span>{stats.totalUnitsSold}</span>
              <span className="text-xs text-emerald-400/80 font-sans font-normal">units</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-400 font-mono">
              <span>Gross Sales:</span>
              <span className="text-white font-bold">{currencySymbol}{stats.totalRevenue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-4 sm:p-5 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Transactions
            </span>
            <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight flex items-baseline gap-2">
              <span>{stats.totalTransactions}</span>
              <span className="text-xs text-zinc-400 font-sans font-normal">orders</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-400 font-mono">
              <span>Avg Basket:</span>
              <span className="text-cyan-300 font-bold">
                {stats.totalTransactions > 0
                  ? (stats.totalUnitsSold / stats.totalTransactions).toFixed(1)
                  : '0'} cans
              </span>
            </div>
          </div>
        </div>

        {/* Best Selling Flavour */}
        <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-4 sm:p-5 relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Best Seller
            </span>
            <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-500/30">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base sm:text-lg font-bold text-amber-200 truncate leading-tight">
              {stats.bestSeller?.name.replace('Monster ', '') || 'Original Green'}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400 font-mono">
              <span className="text-amber-400 font-bold">{stats.bestSeller?.totalSold || 0}</span>
              <span>cans sold all-time</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time-Based Sales Overview (Daily, Weekly, Monthly) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Daily Sales */}
        <div className="bg-[#0f1214] border border-zinc-800/90 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>TODAY'S SALES</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
              {stats.dailyUnits} <span className="text-xs font-sans text-zinc-400 font-normal">cans</span>
            </div>
            <p className="text-xs text-emerald-400 font-mono font-semibold">
              {currencySymbol}{stats.dailyRevenue.toFixed(2)} revenue
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Weekly Sales */}
        <div className="bg-[#0f1214] border border-zinc-800/90 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
              <span>LAST 7 DAYS</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
              {stats.weeklyUnits} <span className="text-xs font-sans text-zinc-400 font-normal">cans</span>
            </div>
            <p className="text-xs text-cyan-400 font-mono font-semibold">
              {currencySymbol}{stats.weeklyRevenue.toFixed(2)} revenue
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Monthly Sales */}
        <div className="bg-[#0f1214] border border-zinc-800/90 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
              <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
              <span>LAST 30 DAYS</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
              {stats.monthlyUnits} <span className="text-xs font-sans text-zinc-400 font-normal">cans</span>
            </div>
            <p className="text-xs text-amber-400 font-mono font-semibold">
              {currencySymbol}{stats.monthlyRevenue.toFixed(2)} revenue
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Top Flavour Leaderboard & Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Top Selling Flavours & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Selling Flavours Leaderboard */}
          <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">Top 5 Best-Selling Flavours</h3>
              </div>
              <button
                onClick={() => onNavigateTab('inventory')}
                className="text-xs text-[#00ff41] hover:underline font-mono"
              >
                View all 23 →
              </button>
            </div>

            <div className="space-y-3">
              {topFlavours.map((item, idx) => {
                const maxSold = topFlavours[0]?.totalSold || 1;
                const percentage = Math.round((item.totalSold / maxSold) * 100);

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-black/40 border border-zinc-800/80 hover:border-zinc-700 transition"
                  >
                    {/* Rank */}
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                        idx === 0
                          ? 'bg-amber-500 text-black shadow-amber-500/30'
                          : idx === 1
                          ? 'bg-zinc-300 text-black'
                          : idx === 2
                          ? 'bg-amber-800 text-amber-100'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    {/* Can mini icon */}
                    <MonsterCan product={item} size="sm" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs sm:text-sm text-zinc-100 truncate">
                          {item.name}
                        </span>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-[#00ff41]">
                            {item.totalSold} sold
                          </span>
                          <span className="text-[10px] text-zinc-400 ml-1.5 font-mono">
                            ({item.stock} left)
                          </span>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.accentColor || '#00ff41',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Operations Bar */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-emerald-950/40 border border-emerald-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-black text-sm text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#00ff41]" />
                FAST-TRACK OPERATIONS
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Record quick sales, add incoming supplier crates, or log damaged stock with 1-click cloud sync.
              </p>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => onNavigateTab('record-sale')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#00ff41] hover:bg-[#00e63a] text-black font-black text-xs uppercase tracking-wider glow-green transition cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-black" />
                Record Sale
              </button>
              <button
                onClick={() => onNavigateTab('inventory')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition cursor-pointer border border-zinc-700"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Manage Stock
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Shared Activity Feed */}
        <div className="space-y-6">
          <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00ff41]" />
                <h3 className="font-bold text-sm sm:text-base text-white">Live Activity Stream</h3>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] animate-ping" />
                REAL-TIME
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {recentLogs.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">No recent stock activity logged.</p>
              ) : (
                recentLogs.slice(0, 8).map((log) => {
                  const isPositive = log.quantityChanged > 0;
                  const isSale = log.type === 'sale';
                  const isDamage = log.type === 'damage';
                  const isReversal = log.type === 'reversal';

                  return (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-black/40 border border-zinc-800/80 text-xs hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono font-bold text-[11px] uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            isSale
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20'
                              : isDamage
                              ? 'bg-red-950 text-red-400 border border-red-500/20'
                              : isReversal
                              ? 'bg-purple-950 text-purple-300 border border-purple-500/20'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-500/20'
                          }`}
                        >
                          {log.type}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-zinc-300 font-medium mt-1 text-[11.5px] leading-snug">
                        {log.reason}
                      </p>

                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-800/50 text-[10px] text-zinc-500 font-mono">
                        <span>By {log.userName}</span>
                        {log.resultingStock !== undefined && (
                          <span className="text-zinc-400">Stock: {log.resultingStock}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => onNavigateTab('sales-history')}
              className="w-full mt-3 py-2 text-center text-xs font-mono text-zinc-400 hover:text-white bg-zinc-900/60 rounded-lg border border-zinc-800 transition cursor-pointer"
            >
              View Full Transaction Audit →
            </button>
          </div>

          {/* Series Stock Breakdown */}
          <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-5">
            <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-3">
              Flavour Series Distribution
            </h4>
            <div className="space-y-2">
              {Object.entries(categorySummary).map(([cat, totalCans]) => (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium">{cat}</span>
                  <span className="font-mono text-zinc-400">
                    <strong className="text-white">{totalCans}</strong> cans
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
