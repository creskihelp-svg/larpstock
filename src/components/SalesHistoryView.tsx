import React, { useState, useMemo } from 'react';
import { SaleTransaction } from '../types';
import { 
  History, 
  Search, 
  Calendar, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  User, 
  CreditCard,
  Banknote,
  Smartphone,
  FileText,
  Filter
} from 'lucide-react';

interface SalesHistoryViewProps {
  sales: SaleTransaction[];
  onReverseSale: (saleId: string, reason?: string) => Promise<void>;
  currencySymbol: string;
}

type DateFilterRange = 'all' | 'today' | 'yesterday' | '7days' | '30days';

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  sales,
  onReverseSale,
  currencySymbol,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateFilterRange>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'reversed'>('all');

  // Reversal Confirmation Modal
  const [selectedSaleToReverse, setSelectedSaleToReverse] = useState<SaleTransaction | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('Customer requested refund / order cancellation');
  const [isReversing, setIsReversing] = useState(false);
  const [reversalError, setReversalError] = useState<string | null>(null);

  // Unique users list for filter
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, string>();
    sales.forEach((s) => map.set(s.userId, s.userName));
    return Array.from(map.entries());
  }, [sales]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 3600000;

    return sales.filter((sale) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        sale.productName.toLowerCase().includes(q) ||
        sale.userName.toLowerCase().includes(q) ||
        sale.id.toLowerCase().includes(q) ||
        sale.paymentMethod.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status
      if (statusFilter === 'active' && sale.isReversed) return false;
      if (statusFilter === 'reversed' && !sale.isReversed) return false;

      // User
      if (userFilter !== 'all' && sale.userId !== userFilter) return false;

      // Date Range
      const saleTime = new Date(sale.timestamp).getTime();
      if (dateRange === 'today') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        if (saleTime < startOfToday.getTime()) return false;
      } else if (dateRange === 'yesterday') {
        const startOfYesterday = new Date();
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        startOfYesterday.setHours(0, 0, 0, 0);
        const endOfYesterday = new Date();
        endOfYesterday.setDate(endOfYesterday.getDate() - 1);
        endOfYesterday.setHours(23, 59, 59, 999);
        if (saleTime < startOfYesterday.getTime() || saleTime > endOfYesterday.getTime()) return false;
      } else if (dateRange === '7days') {
        if (saleTime < now - 7 * oneDay) return false;
      } else if (dateRange === '30days') {
        if (saleTime < now - 30 * oneDay) return false;
      }

      return true;
    });
  }, [sales, searchQuery, dateRange, userFilter, statusFilter]);

  // Aggregate Metrics for filtered set
  const metrics = useMemo(() => {
    let units = 0;
    let revenue = 0;
    let reversedCount = 0;

    filteredSales.forEach((s) => {
      if (s.isReversed) {
        reversedCount++;
      } else {
        units += s.quantity;
        revenue += s.totalAmount;
      }
    });

    return {
      count: filteredSales.length,
      activeCount: filteredSales.length - reversedCount,
      reversedCount,
      units,
      revenue,
      avgOrder: filteredSales.length > 0 ? (revenue / (filteredSales.length - reversedCount || 1)) : 0,
    };
  }, [filteredSales]);

  // Handle Reversal Submit
  const handleConfirmReversal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSaleToReverse) return;

    setIsReversing(true);
    setReversalError(null);

    try {
      await onReverseSale(selectedSaleToReverse.id, reversalReason);
      setSelectedSaleToReverse(null);
    } catch (err: any) {
      setReversalError(err.message || 'Failed to reverse sale');
    } finally {
      setIsReversing(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Date & Time',
      'Flavour',
      'Quantity (Cans)',
      'Unit Price',
      'Total Amount',
      'Payment Method',
      'Staff / User',
      'Status',
      'Reversed At',
      'Reversed By',
    ];

    const rows = filteredSales.map((s) => [
      s.id,
      new Date(s.timestamp).toLocaleString(),
      `"${s.productName.replace(/"/g, '""')}"`,
      s.quantity,
      s.unitPrice.toFixed(2),
      s.totalAmount.toFixed(2),
      s.paymentMethod,
      `"${s.userName.replace(/"/g, '""')}"`,
      s.isReversed ? 'REVERSED / VOID' : 'COMPLETED',
      s.reversedAt ? new Date(s.reversedAt).toLocaleString() : '',
      s.reversedBy || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `monster_sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Top Filter & Metrics Bar */}
      <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by flavour, transaction ID, staff name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/60 border border-zinc-700/80 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff41]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-mono font-bold transition cursor-pointer border border-zinc-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-zinc-800/80">
          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-zinc-800 overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRange(d.id as DateFilterRange)}
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold whitespace-nowrap transition cursor-pointer ${
                  dateRange === d.id
                    ? 'bg-emerald-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* User Filter Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500 font-mono">Staff:</span>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="bg-black/60 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#00ff41]"
            >
              <option value="all">All Team Members</option>
              {uniqueUsers.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500 font-mono">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-black/60 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#00ff41]"
            >
              <option value="all">All Records</option>
              <option value="active">Active Only</option>
              <option value="reversed">Voided / Reversed Only</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800/80 text-xs font-mono">
          <div>
            <span className="text-zinc-500 block uppercase text-[10px]">Transactions</span>
            <span className="text-base font-bold text-white">{metrics.activeCount} orders</span>
          </div>
          <div>
            <span className="text-zinc-500 block uppercase text-[10px]">Cans Sold</span>
            <span className="text-base font-bold text-[#00ff41]">{metrics.units} cans</span>
          </div>
          <div>
            <span className="text-zinc-500 block uppercase text-[10px]">Filtered Revenue</span>
            <span className="text-base font-bold text-emerald-400">
              {currencySymbol}{metrics.revenue.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block uppercase text-[10px]">Average Order</span>
            <span className="text-base font-bold text-cyan-300">
              {currencySymbol}{metrics.avgOrder.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction Table / Cards */}
      <div className="bg-[#0f1214] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-zinc-300">No Sales Records Found</h4>
            <p className="text-xs text-zinc-500 mt-1">Try adjusting your filters or date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-black/60 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10.5px]">
                  <th className="py-3 px-4">Tx ID / Time</th>
                  <th className="py-3 px-4">Flavour</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 font-mono">
                {filteredSales.map((sale) => {
                  const saleDate = new Date(sale.timestamp);

                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-zinc-900/50 transition ${
                        sale.isReversed ? 'bg-red-950/10 opacity-70' : ''
                      }`}
                    >
                      {/* ID and Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-white font-bold block">{sale.id}</span>
                        <span className="text-[11px] text-zinc-500">
                          {saleDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                          {saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Product Name */}
                      <td className="py-3 px-4 font-sans font-bold text-white whitespace-nowrap">
                        {sale.productName}
                        {sale.customerNotes && (
                          <span className="block font-mono text-[10px] text-zinc-400 font-normal truncate max-w-[200px]">
                            Note: {sale.customerNotes}
                          </span>
                        )}
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 font-bold text-emerald-400 whitespace-nowrap">
                        {sale.quantity} cans
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                        {currencySymbol}{sale.totalAmount.toFixed(2)}
                        <span className="text-[10px] text-zinc-500 block font-normal">
                          @{currencySymbol}{sale.unitPrice.toFixed(2)}/can
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10.5px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {sale.paymentMethod}
                        </span>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap text-zinc-300 font-sans">
                        {sale.userName}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {sale.isReversed ? (
                          <div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-500/30">
                              REVERSED
                            </span>
                            {sale.reversedAt && (
                              <span className="block text-[9px] text-zinc-500 mt-0.5">
                                Stock returned
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                            COMPLETED
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {!sale.isReversed ? (
                          <button
                            onClick={() => {
                              setSelectedSaleToReverse(sale);
                              setReversalError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-red-950/80 text-zinc-400 hover:text-red-300 border border-zinc-700 hover:border-red-500/40 text-[11px] font-bold transition cursor-pointer"
                            title="Reverse sale and restore cans back to stock"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reverse</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-zinc-600 italic">Voided</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reversal Confirmation Modal */}
      {selectedSaleToReverse && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121518] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedSaleToReverse(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-red-950/80 text-red-400 border border-red-500/40">
                <RotateCcw className="w-6 h-6 animate-spin-reverse" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Reverse Sale Transaction</h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Order ID: {selectedSaleToReverse.id}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/60 border border-zinc-800 text-xs space-y-1 mb-4">
              <div className="flex justify-between text-zinc-300">
                <span>Product:</span>
                <strong className="text-white">{selectedSaleToReverse.productName}</strong>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Quantity to Restore:</span>
                <strong className="text-emerald-400">+{selectedSaleToReverse.quantity} cans</strong>
              </div>
              <div className="flex justify-between text-zinc-300">
                <span>Refund Amount:</span>
                <strong className="text-white">{currencySymbol}{selectedSaleToReverse.totalAmount.toFixed(2)}</strong>
              </div>
            </div>

            <p className="text-xs text-zinc-300 mb-3">
              Reversing this transaction will <strong>automatically restore {selectedSaleToReverse.quantity} cans</strong> back to the live shared inventory across all connected devices and log a reversal audit entry.
            </p>

            {reversalError && (
              <div className="mb-3 p-2.5 rounded-lg bg-red-950 border border-red-500 text-xs text-red-200">
                {reversalError}
              </div>
            )}

            <form onSubmit={handleConfirmReversal} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-400 uppercase mb-1">
                  Reason for Reversal / Cancellation
                </label>
                <input
                  type="text"
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSaleToReverse(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReversing}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-mono uppercase tracking-wider transition cursor-pointer"
                >
                  {isReversing ? 'Reversing & Restoring Stock...' : 'Confirm Reversal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
