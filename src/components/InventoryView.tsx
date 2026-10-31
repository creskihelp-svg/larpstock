import React, { useState, useMemo } from 'react';
import { Product, ProductCategory } from '../types';
import { MonsterCan } from './MonsterCan';
import { 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  Truck, 
  Trash2, 
  SlidersHorizontal, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  PackageCheck,
  TrendingUp,
  Tag,
  ArrowUpDown,
  Edit3
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  onRestock: (productId: string, quantity: number, notes?: string, supplierBatch?: string) => Promise<void>;
  onDamage: (productId: string, quantity: number, reason?: string) => Promise<void>;
  onAdjust: (productId: string, newStock: number, reason?: string) => Promise<void>;
  onUpdateDetails: (productId: string, updates: Partial<Product>) => Promise<void>;
  onSelectForSale: (product: Product) => void;
  currencySymbol: string;
}

type StockFilterType = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type SortField = 'stock_desc' | 'stock_asc' | 'sold_desc' | 'name_asc';

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onRestock,
  onDamage,
  onAdjust,
  onUpdateDetails,
  onSelectForSale,
  currencySymbol,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('stock_desc');

  // Modal states
  const [activeModal, setActiveModal] = useState<{
    type: 'restock' | 'damage' | 'adjust' | 'edit';
    product: Product;
  } | null>(null);

  // Form states for modals
  const [formQuantity, setFormQuantity] = useState<number>(12);
  const [formReason, setFormReason] = useState<string>('');
  const [formBatch, setFormBatch] = useState<string>('');
  const [formPrice, setFormPrice] = useState<number>(2.99);
  const [formThreshold, setFormThreshold] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Categories list
  const categories: (ProductCategory | 'all')[] = [
    'all',
    'Ultra Series',
    'Juiced Series',
    'Nitro Series',
    'Motorsport Edition',
    'Classic Core',
    'Heritage Series',
  ];

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.flavorProfile.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query);

        if (!matchesSearch) return false;

        // Stock filter
        const isOutOfStock = p.stock === 0;
        const isLowStock = p.stock > 0 && p.stock <= (p.lowStockThreshold || 5);

        if (stockFilter === 'out_of_stock' && !isOutOfStock) return false;
        if (stockFilter === 'low_stock' && !isLowStock) return false;
        if (stockFilter === 'in_stock' && isOutOfStock) return false;

        // Category filter
        if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'stock_desc') return b.stock - a.stock;
        if (sortBy === 'stock_asc') return a.stock - b.stock;
        if (sortBy === 'sold_desc') return b.totalSold - a.totalSold;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, searchQuery, stockFilter, categoryFilter, sortBy]);

  // Counts for tabs
  const counts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    products.forEach((p) => {
      if (p.stock === 0) outOfStock++;
      else if (p.stock <= (p.lowStockThreshold || 5)) lowStock++;
      else inStock++;
    });
    return { all: products.length, inStock, lowStock, outOfStock };
  }, [products]);

  // Open modal handlers
  const openRestockModal = (product: Product) => {
    setActiveModal({ type: 'restock', product });
    setFormQuantity(24); // default 24 case tray
    setFormBatch(`BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormReason('Standard warehouse delivery shipment');
    setActionError(null);
  };

  const openDamageModal = (product: Product) => {
    setActiveModal({ type: 'damage', product });
    setFormQuantity(1);
    setFormReason('Dented / leaking can during handling');
    setActionError(null);
  };

  const openAdjustModal = (product: Product) => {
    setActiveModal({ type: 'adjust', product });
    setFormQuantity(product.stock);
    setFormReason('Physical stocktake count reconciliation');
    setActionError(null);
  };

  const openEditModal = (product: Product) => {
    setActiveModal({ type: 'edit', product });
    setFormPrice(product.unitPrice);
    setFormThreshold(product.lowStockThreshold || 5);
    setActionError(null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setActionError(null);
  };

  // Submit modal action
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    setIsSubmitting(true);
    setActionError(null);

    try {
      if (activeModal.type === 'restock') {
        if (formQuantity <= 0) throw new Error('Restock quantity must be at least 1 can');
        await onRestock(activeModal.product.id, formQuantity, formReason, formBatch);
      } else if (activeModal.type === 'damage') {
        if (formQuantity <= 0) throw new Error('Damage write-off quantity must be at least 1 can');
        if (formQuantity > activeModal.product.stock) {
          throw new Error(`Cannot write off ${formQuantity} cans. Available stock is only ${activeModal.product.stock}.`);
        }
        await onDamage(activeModal.product.id, formQuantity, formReason);
      } else if (activeModal.type === 'adjust') {
        if (formQuantity < 0) throw new Error('Stock cannot be negative');
        await onAdjust(activeModal.product.id, formQuantity, formReason);
      } else if (activeModal.type === 'edit') {
        if (formPrice <= 0) throw new Error('Price must be greater than 0');
        await onUpdateDetails(activeModal.product.id, {
          unitPrice: formPrice,
          lowStockThreshold: formThreshold,
        });
      }
      closeModal();
    } catch (err: any) {
      setActionError(err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Top Controls Header */}
      <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by flavour name, SKU (e.g. Pipeline, White, MNST-01)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/60 border border-zinc-700/80 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#00ff41] transition"
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

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-zinc-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="bg-black/60 border border-zinc-700/80 rounded-lg px-3 py-2 text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-[#00ff41]"
            >
              <option value="stock_desc">Highest Stock First</option>
              <option value="stock_asc">Lowest Stock First</option>
              <option value="sold_desc">Best Sellers First</option>
              <option value="name_asc">Name (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Stock Status Filter Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800/80 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setStockFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
              stockFilter === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-600 shadow'
                : 'text-zinc-400 hover:text-white bg-black/40'
            }`}
          >
            All Products ({counts.all})
          </button>
          <button
            onClick={() => setStockFilter('in_stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
              stockFilter === 'in_stock'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50 glow-green-sm'
                : 'text-zinc-400 hover:text-emerald-400 bg-black/40'
            }`}
          >
            In Stock ({counts.inStock})
          </button>
          <button
            onClick={() => setStockFilter('low_stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
              stockFilter === 'low_stock'
                ? 'bg-amber-950/80 text-amber-400 border border-amber-500/50'
                : 'text-zinc-400 hover:text-amber-400 bg-black/40'
            }`}
          >
            Low Stock ≤5 ({counts.lowStock})
          </button>
          <button
            onClick={() => setStockFilter('out_of_stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap cursor-pointer ${
              stockFilter === 'out_of_stock'
                ? 'bg-red-950/80 text-red-400 border border-red-500/50'
                : 'text-zinc-400 hover:text-red-400 bg-black/40'
            }`}
          >
            Out of Stock ({counts.outOfStock})
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] text-zinc-500 uppercase font-mono mr-1 shrink-0">Series:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition whitespace-nowrap cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-emerald-500 text-black font-black'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat === 'all' ? 'All Series' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of 23 Monster Energy Flavours */}
      {filteredProducts.length === 0 ? (
        <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-300">No Monster flavours match your filter</h3>
          <p className="text-xs text-zinc-500 mt-1">Try resetting your search query or selecting "All Products".</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStockFilter('all');
              setCategoryFilter('all');
            }}
            className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-mono transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock === 0;
            const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);

            return (
              <div
                key={product.id}
                className={`bg-[#0f1214] border rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:translate-y-[-2px] relative overflow-hidden group ${
                  isOutOfStock
                    ? 'border-red-900/60 shadow-lg'
                    : isLowStock
                    ? 'border-amber-500/50 shadow-md shadow-amber-950/20'
                    : 'border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                {/* Accent glow line top */}
                <div
                  className="absolute top-0 inset-x-0 h-1 transition-opacity"
                  style={{ backgroundColor: product.accentColor || '#00ff41' }}
                />

                {/* Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border"
                      style={{
                        backgroundColor: `${product.accentColor}15`,
                        color: product.accentColor,
                        borderColor: `${product.accentColor}35`,
                      }}
                    >
                      {product.category}
                    </span>

                    <button
                      onClick={() => openEditModal(product)}
                      className="p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                      title="Edit price and threshold"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Can & Primary Info Layout */}
                  <div className="flex items-center gap-3 my-2">
                    {/* Visual 3D Monster Can */}
                    <div className="shrink-0 py-1">
                      <MonsterCan product={product} size="md" />
                    </div>

                    {/* Stock Metrics */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm sm:text-base text-white truncate leading-snug" title={product.name}>
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5" title={product.flavorProfile}>
                        {product.flavorProfile}
                      </p>

                      {/* Prominent Stock Badge */}
                      <div className="mt-2.5 p-2 rounded-lg bg-black/60 border border-zinc-800">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[10px] uppercase font-mono text-zinc-400">Current Stock</span>
                          <span
                            className={`font-black font-mono text-xl sm:text-2xl leading-none ${
                              isOutOfStock
                                ? 'text-red-500'
                                : isLowStock
                                ? 'text-amber-400'
                                : 'text-[#00ff41]'
                            }`}
                          >
                            {product.stock}
                          </span>
                        </div>

                        {/* Status Label */}
                        <div className="mt-1 flex items-center justify-between text-[10px] font-mono">
                          {isOutOfStock ? (
                            <span className="text-red-400 font-bold uppercase flex items-center gap-1">
                              ● OUT OF STOCK
                            </span>
                          ) : isLowStock ? (
                            <span className="text-amber-400 font-bold uppercase flex items-center gap-1 animate-pulse">
                              ▲ LOW STOCK (≤{product.lowStockThreshold || 5})
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              ✓ HEALTHY STOCK
                            </span>
                          )}
                          <span className="text-zinc-400">{currencySymbol}{product.unitPrice.toFixed(2)}/can</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lifetime Stats */}
                  <div className="grid grid-cols-2 gap-2 my-2 py-2 border-t border-b border-zinc-800/80 text-[11px] font-mono">
                    <div>
                      <span className="text-zinc-500 block text-[9.5px] uppercase">Total Units Sold</span>
                      <span className="font-bold text-zinc-200">{product.totalSold} cans</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9.5px] uppercase">Stock Received</span>
                      <span className="font-bold text-zinc-200">{product.stockReceived} cans</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-2 mt-2 pt-1">
                  {/* Quick POS Sale Button */}
                  <button
                    onClick={() => onSelectForSale(product)}
                    disabled={isOutOfStock}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      isOutOfStock
                        ? 'bg-zinc-800/60 text-zinc-500 cursor-not-allowed border border-zinc-800'
                        : 'bg-[#00ff41] hover:bg-[#00e63a] text-black glow-green-sm'
                    }`}
                  >
                    <span>{isOutOfStock ? 'CANNOT SELL (EMPTY)' : 'RECORD SALE'}</span>
                  </button>

                  {/* Stock Management Actions Row */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Add Stock */}
                    <button
                      onClick={() => openRestockModal(product)}
                      className="py-1.5 px-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-700/80 text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      title="Add incoming stock shipment"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Stock</span>
                    </button>

                    {/* Write off damaged */}
                    <button
                      onClick={() => openDamageModal(product)}
                      disabled={isOutOfStock}
                      className={`py-1.5 px-2 rounded-md border text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
                        isOutOfStock
                          ? 'bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-red-400 border-zinc-700/80'
                      }`}
                      title="Write off damaged / leaking stock"
                    >
                      <Minus className="w-3 h-3" />
                      <span>Damage</span>
                    </button>

                    {/* Manual Audit Calibration */}
                    <button
                      onClick={() => openAdjustModal(product)}
                      className="py-1.5 px-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-zinc-700/80 text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      title="Manually adjust quantity to exact physical count"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>Audit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DIALOG */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121518] border border-zinc-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-4">
              <MonsterCan product={activeModal.product} size="sm" />
              <div>
                <h3 className="font-bold text-base text-white">
                  {activeModal.type === 'restock' && 'Add Incoming Stock'}
                  {activeModal.type === 'damage' && 'Write Off Damaged / Missing Stock'}
                  {activeModal.type === 'adjust' && 'Manual Stock Calibration'}
                  {activeModal.type === 'edit' && 'Edit Product Details'}
                </h3>
                <p className="text-xs text-emerald-400 font-mono font-bold">
                  {activeModal.product.name} • Available: {activeModal.product.stock}
                </p>
              </div>
            </div>

            {actionError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-500/50 text-xs text-red-200">
                {actionError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              {/* RESTOCK FORM */}
              {activeModal.type === 'restock' && (
                <>
                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                      Incoming Quantity (Cans)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={formQuantity}
                        onChange={(e) => setFormQuantity(parseInt(e.target.value, 10) || 0)}
                        className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-base focus:outline-none focus:border-emerald-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setFormQuantity(12)}
                        className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-mono"
                      >
                        +12 Pack
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormQuantity(24)}
                        className="px-2.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs font-mono"
                      >
                        +24 Tray
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                      Supplier Batch / Tracking #
                    </label>
                    <input
                      type="text"
                      value={formBatch}
                      onChange={(e) => setFormBatch(e.target.value)}
                      placeholder="e.g. BATCH-2026-X88"
                      className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                      Restock Notes / Reason
                    </label>
                    <input
                      type="text"
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value)}
                      placeholder="e.g. Pallet delivery from regional depot"
                      className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </>
              )}

              {/* DAMAGE WRITE-OFF FORM */}
              {activeModal.type === 'damage' && (
                <>
                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                      Quantity to Remove (Available: {activeModal.product.stock})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={activeModal.product.stock}
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-base focus:outline-none focus:border-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                      Disposal / Shrinkage Reason
                    </label>
                    <select
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-red-500"
                    >
                      <option value="Dented / punctured can leaking in crate">Dented / Punctured Can</option>
                      <option value="Expired past best-by date">Expired Past Best-by Date</option>
                      <option value="Damaged in transit / unboxing">Damaged in Transit / Handling</option>
                      <option value="Unexplained inventory shrinkage">Inventory Shrinkage</option>
                      <option value="Sample / testing can">Promotional Sample</option>
                    </select>
                  </div>
                </>
              )}

              {/* MANUAL ADJUST FORM */}
              {activeModal.type === 'adjust' && (
                <>
                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                      New Physical Stock Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-base focus:outline-none focus:border-cyan-500"
                      required
                    />
                    <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                      Current count is {activeModal.product.stock}. Difference:{' '}
                      <strong className={formQuantity >= activeModal.product.stock ? 'text-emerald-400' : 'text-red-400'}>
                        {formQuantity - activeModal.product.stock >= 0 ? '+' : ''}
                        {formQuantity - activeModal.product.stock} cans
                      </strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                      Audit Reason
                    </label>
                    <input
                      type="text"
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value)}
                      placeholder="e.g. End of month physical audit reconciliation"
                      className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </>
              )}

              {/* EDIT DETAILS FORM */}
              {activeModal.type === 'edit' && (
                <>
                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                      Unit Sale Price ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.10"
                      value={formPrice}
                      onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-base focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                      Low Stock Warning Threshold (Cans)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formThreshold}
                      onChange={(e) => setFormThreshold(parseInt(e.target.value, 10) || 5)}
                      className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-base focus:outline-none focus:border-emerald-500"
                      required
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">
                      An alert triggers whenever available stock falls to or below this amount. Default is 5.
                    </p>
                  </div>
                </>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                    activeModal.type === 'damage'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-[#00ff41] hover:bg-[#00e63a] text-black glow-green-sm'
                  }`}
                >
                  {isSubmitting ? 'Syncing...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
