import React, { useState, useMemo } from 'react';
import { Product, SaleTransaction } from '../types';
import { MonsterCan } from './MonsterCan';
import { 
  Zap, 
  Search, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Clock,
  Sparkles
} from 'lucide-react';

interface RecordSaleViewProps {
  products: Product[];
  onConfirmSale: (payload: {
    productId: string;
    quantity: number;
    paymentMethod: string;
    customerNotes?: string;
  }) => Promise<void>;
  preselectedProduct?: Product | null;
  recentSales: SaleTransaction[];
  currencySymbol: string;
}

export const RecordSaleView: React.FC<RecordSaleViewProps> = ({
  products,
  onConfirmSale,
  preselectedProduct,
  recentSales,
  currencySymbol,
}) => {
  // Selected product
  const [selectedProductId, setSelectedProductId] = useState<string>(
    preselectedProduct?.id || products.find((p) => p.stock > 0)?.id || products[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Cash' | 'Digital Pay' | 'Invoice'>('Card');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastSuccessSale, setLastSuccessSale] = useState<{
    productName: string;
    quantity: number;
    totalAmount: number;
  } | null>(null);

  // Selected product object
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  // Filtered flavours for the quick selector
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      return true;
    });
  }, [products, searchQuery, categoryFilter]);

  // Calculations
  const availableStock = selectedProduct ? selectedProduct.stock : 0;
  const isExceedingStock = quantity > availableStock;
  const isOutOfStock = availableStock === 0;
  const unitPrice = selectedProduct ? selectedProduct.unitPrice : 0;
  const totalAmount = parseFloat((unitPrice * Math.max(0, quantity)).toFixed(2));

  // Quick quantity buttons
  const handleSetQuantity = (val: number) => {
    const clamped = Math.max(1, Math.min(val, availableStock > 0 ? availableStock : 1));
    setQuantity(clamped);
    setErrorMsg(null);
  };

  // Submit Sale
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedProduct) {
      setErrorMsg('Please select a Monster flavour');
      return;
    }

    if (quantity <= 0) {
      setErrorMsg('Quantity must be at least 1 can');
      return;
    }

    // Critical check
    if (quantity > selectedProduct.stock) {
      setErrorMsg(
        `Sale exceeds available stock! Requested ${quantity} cans, but only ${selectedProduct.stock} are in stock.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmSale({
        productId: selectedProduct.id,
        quantity,
        paymentMethod,
        customerNotes: customerNotes.trim() || undefined,
      });

      // Show success toast
      setLastSuccessSale({
        productName: selectedProduct.name,
        quantity,
        totalAmount,
      });

      // Reset quantity
      setQuantity(1);
      setCustomerNotes('');
      setTimeout(() => setLastSuccessSale(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to record sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Success Notification Alert */}
      {lastSuccessSale && (
        <div className="bg-emerald-950/90 border border-[#00ff41] rounded-xl p-4 flex items-center justify-between glow-green animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#00ff41] text-black">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Sale Confirmed & Synchronised</span>
                <Sparkles className="w-4 h-4 text-[#00ff41]" />
              </h4>
              <p className="text-xs text-zinc-300 mt-0.5">
                Sold {lastSuccessSale.quantity}x {lastSuccessSale.productName} for{' '}
                <strong className="text-[#00ff41] font-mono">
                  {currencySymbol}{lastSuccessSale.totalAmount.toFixed(2)}
                </strong>
                . Inventory updated across all connected devices.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLastSuccessSale(null)}
            className="text-zinc-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 2-Column POS Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Flavour Browser & Selector (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#00ff41]" />
                Select Flavour to Sell
              </h3>
              <span className="text-xs text-zinc-400 font-mono">
                {products.length} Flavours in Catalog
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search flavour by name or series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-black/60 border border-zinc-700/80 rounded-lg text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff41]"
              />
            </div>

            {/* Category Quick Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
              {['all', 'Ultra Series', 'Juiced Series', 'Motorsport Edition', 'Classic Core'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap cursor-pointer transition ${
                    categoryFilter === cat
                      ? 'bg-emerald-500 text-black font-bold'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat.replace(' Series', '').replace(' Edition', '')}
                </button>
              ))}
            </div>

            {/* Flavour Grid Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[480px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const isSelected = p.id === selectedProductId;
                const isZeroStock = p.stock === 0;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductId(p.id);
                      if (quantity > p.stock && p.stock > 0) {
                        setQuantity(p.stock);
                      }
                      setErrorMsg(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-emerald-950/40 border-[#00ff41] glow-green-sm'
                        : isZeroStock
                        ? 'bg-zinc-900/30 border-zinc-800/60 opacity-60 hover:opacity-80'
                        : 'bg-black/50 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <MonsterCan product={p} size="sm" />
                      <div className="text-right">
                        <span
                          className={`text-xs font-mono font-bold block ${
                            isZeroStock
                              ? 'text-red-400'
                              : p.stock <= (p.lowStockThreshold || 5)
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {p.stock} left
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {currencySymbol}{p.unitPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="text-xs font-bold text-white truncate" title={p.name}>
                        {p.name.replace('Monster ', '')}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate">{p.category}</div>
                    </div>

                    {isZeroStock && (
                      <span className="mt-1 inline-block text-[9px] font-bold text-red-400 uppercase tracking-wider">
                        Out of stock
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: POS Checkout Panel & Atomic Deduction (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-5 shadow-xl relative overflow-hidden">
            <h3 className="font-bold text-base text-white flex items-center justify-between pb-3 border-b border-zinc-800">
              <span>Checkout & Order Summary</span>
              <span className="text-xs font-mono text-emerald-400">POS TERMINAL</span>
            </h3>

            {/* Error Message */}
            {errorMsg && (
              <div className="mt-3 p-3 rounded-lg bg-red-950/90 border border-red-500/60 text-xs text-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {selectedProduct ? (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {/* Active Selection Hero Banner */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-black/60 border border-zinc-700/80">
                  <MonsterCan product={selectedProduct} size="md" />
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-block mb-1"
                      style={{
                        backgroundColor: `${selectedProduct.accentColor}20`,
                        color: selectedProduct.accentColor,
                        borderColor: `${selectedProduct.accentColor}40`,
                      }}
                    >
                      {selectedProduct.category}
                    </span>
                    <h4 className="font-black text-base text-white leading-tight truncate">
                      {selectedProduct.name}
                    </h4>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {selectedProduct.flavorProfile}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                      <div>
                        <span className="text-zinc-500 block text-[9.5px]">AVAILABLE</span>
                        <span
                          className={`font-black text-sm ${
                            isOutOfStock
                              ? 'text-red-400'
                              : availableStock <= (selectedProduct.lowStockThreshold || 5)
                              ? 'text-amber-400'
                              : 'text-[#00ff41]'
                          }`}
                        >
                          {availableStock} Cans
                        </span>
                      </div>
                      <div className="border-l border-zinc-800 pl-3">
                        <span className="text-zinc-500 block text-[9.5px]">UNIT PRICE</span>
                        <span className="font-bold text-white">
                          {currencySymbol}{unitPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quantity Control Stepper */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono font-bold text-zinc-300 uppercase">
                      Quantity Sold
                    </label>
                    <span className="text-xs font-mono text-zinc-400">
                      Stock: <strong className="text-white">{availableStock}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-11 h-11 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition border border-zinc-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <input
                      type="number"
                      min="1"
                      max={availableStock}
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                      className={`flex-1 h-11 bg-black text-center text-xl font-mono font-black rounded-lg border focus:outline-none transition ${
                        isExceedingStock
                          ? 'border-red-500 text-red-400 bg-red-950/20'
                          : 'border-zinc-700 text-white focus:border-[#00ff41]'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                      disabled={quantity >= availableStock}
                      className="w-11 h-11 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition border border-zinc-700"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Quantity Preset Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => handleSetQuantity(1)}
                      className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-bold text-zinc-300 rounded border border-zinc-800 cursor-pointer"
                    >
                      1 Can
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuantity(2)}
                      className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-bold text-zinc-300 rounded border border-zinc-800 cursor-pointer"
                    >
                      2 Cans
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuantity(4)}
                      className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-bold text-zinc-300 rounded border border-zinc-800 cursor-pointer"
                    >
                      4-Pack
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuantity(availableStock)}
                      disabled={availableStock <= 0}
                      className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-bold text-emerald-400 rounded border border-zinc-800 cursor-pointer disabled:opacity-30"
                    >
                      Max ({availableStock})
                    </button>
                  </div>

                  {isExceedingStock && (
                    <p className="text-xs text-red-400 font-bold mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Cannot exceed available stock of {availableStock} cans!
                    </p>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'Card', label: 'Card', icon: CreditCard },
                      { id: 'Cash', label: 'Cash', icon: Banknote },
                      { id: 'Digital Pay', label: 'Digital Pay', icon: Smartphone },
                      { id: 'Invoice', label: 'Invoice', icon: FileText },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = paymentMethod === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPaymentMethod(item.id as any)}
                          className={`p-2.5 rounded-lg border flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
                            active
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500 glow-green-sm'
                              : 'bg-black/40 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-emerald-400" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional Customer Notes */}
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-400 uppercase mb-1">
                    Customer Reference / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="e.g. Gym member #402, Counter takeaway"
                    className="w-full bg-black/60 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff41]"
                  />
                </div>

                {/* Price Total Card */}
                <div className="p-3 rounded-xl bg-black/80 border border-zinc-800 space-y-1">
                  <div className="flex justify-between text-xs text-zinc-400 font-mono">
                    <span>Subtotal ({quantity} cans × {currencySymbol}{unitPrice.toFixed(2)})</span>
                    <span>{currencySymbol}{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-zinc-800">
                    <span className="text-sm font-bold text-white uppercase font-mono">Total Due</span>
                    <span className="text-2xl font-black font-mono text-[#00ff41] glow-green-text">
                      {currencySymbol}{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isExceedingStock || isOutOfStock}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isExceedingStock || isOutOfStock
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                      : 'bg-[#00ff41] hover:bg-[#00e63a] text-black glow-green shadow-lg scale-[1.01]'
                  }`}
                >
                  <Zap className="w-5 h-5 fill-black" />
                  <span>
                    {isSubmitting
                      ? 'Deducting Stock & Syncing...'
                      : isOutOfStock
                      ? 'Out of Stock'
                      : isExceedingStock
                      ? 'Exceeds Available Stock'
                      : `CONFIRM SALE (${currencySymbol}${totalAmount.toFixed(2)})`}
                  </span>
                </button>
              </form>
            ) : (
              <p className="text-xs text-zinc-500 py-10 text-center">
                Select a Monster flavour from the left panel to begin.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Recorded Sales Mini Ticker */}
      <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-5">
        <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          Recently Synchronised Sales (Live Cloud Feed)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentSales.slice(0, 6).map((sale) => (
            <div
              key={sale.id}
              className={`p-3 rounded-lg bg-black/40 border border-zinc-800/80 text-xs flex items-center justify-between ${
                sale.isReversed ? 'opacity-50 line-through' : ''
              }`}
            >
              <div>
                <p className="font-bold text-white truncate max-w-[170px]">{sale.productName}</p>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                  {sale.quantity} cans • {sale.paymentMethod} • by {sale.userName.split(' ')[0]}
                </p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-[#00ff41] block">
                  {currencySymbol}{sale.totalAmount.toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
