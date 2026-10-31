import React from 'react';
import { Product } from '../types';

interface MonsterCanProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export const MonsterCan: React.FC<MonsterCanProps> = ({
  product,
  size = 'md',
  showDetails = false,
  className = '',
}) => {
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= product.lowStockThreshold;

  // Sizing definitions
  const dimensions = {
    sm: { canW: 'w-12', canH: 'h-24', claw: 'w-6 h-8', text: 'text-[9px]' },
    md: { canW: 'w-20', canH: 'h-40', claw: 'w-10 h-14', text: 'text-xs' },
    lg: { canW: 'w-28', canH: 'h-56', claw: 'w-14 h-20', text: 'text-sm' },
  }[size];

  // Derive subtle background gradient based on accentColor
  const accent = product.accentColor || '#00ff41';

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* 3D Stylized Monster Energy Can */}
      <div className={`relative ${dimensions.canW} ${dimensions.canH} flex flex-col items-center group transition-transform duration-300 hover:scale-105`}>
        {/* Can Tab & Rim */}
        <div className="w-3/4 h-2 rounded-t-md bg-gradient-to-r from-zinc-500 via-zinc-300 to-zinc-600 border border-zinc-400/40 shadow-inner z-10 flex items-center justify-center">
          <div className="w-2 h-1 bg-zinc-700 rounded-sm"></div>
        </div>

        {/* Can Upper Bevel */}
        <div className="w-[88%] h-2 bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-800 rounded-t-sm z-10"></div>

        {/* Can Main Cylinder Body */}
        <div
          className="relative w-full flex-1 rounded-sm overflow-hidden flex flex-col justify-between items-center py-2 shadow-xl border border-white/10"
          style={{
            background: `linear-gradient(135deg, #18191c 0%, #0c0d0e 50%, #16181b 100%)`,
            boxShadow: isOutOfStock
              ? 'inset 0 0 15px rgba(0,0,0,0.8)'
              : `0 8px 25px -4px ${accent}25, inset 0 0 20px rgba(0,0,0,0.6)`,
          }}
        >
          {/* Vertical highlight reflections */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none opacity-40"></div>
          
          {/* Subtle themed color tint on top and bottom */}
          <div
            className="absolute top-0 inset-x-0 h-10 opacity-30 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 0%, ${accent}, transparent 70%)` }}
          ></div>
          <div
            className="absolute bottom-0 inset-x-0 h-10 opacity-30 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 100%, ${accent}, transparent 70%)` }}
          ></div>

          {/* Top Series Text */}
          <div className="relative z-10 text-center px-1">
            <span
              className="font-black uppercase tracking-wider block text-[8px] leading-tight"
              style={{ color: accent }}
            >
              {product.category.replace(' Series', '').replace(' Edition', '')}
            </span>
          </div>

          {/* Iconic Monster Claw Icon SVG */}
          <div className={`relative z-10 ${dimensions.claw} my-auto flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
            <svg
              viewBox="0 0 100 120"
              className="w-full h-full filter drop-shadow-md"
              fill={accent}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Monster 3-scratch claw design */}
              {/* Left scratch */}
              <path
                d="M18 10 C16 35, 14 70, 26 110 C29 90, 31 55, 34 25 C30 20, 24 15, 18 10 Z"
                fill={accent}
                opacity={isOutOfStock ? 0.3 : 0.95}
              />
              {/* Center tall scratch */}
              <path
                d="M44 4 C42 40, 40 85, 52 118 C56 95, 58 50, 60 18 C54 13, 49 8, 44 4 Z"
                fill={accent}
                opacity={isOutOfStock ? 0.3 : 1}
              />
              {/* Right scratch */}
              <path
                d="M72 16 C69 45, 68 75, 80 105 C83 85, 85 58, 86 32 C81 26, 76 21, 72 16 Z"
                fill={accent}
                opacity={isOutOfStock ? 0.3 : 0.9}
              />
            </svg>
          </div>

          {/* Bottom Flavour Short Name */}
          <div className="relative z-10 text-center px-1 w-full truncate">
            <div className="text-[7.5px] font-black uppercase text-zinc-300 tracking-tight truncate px-1">
              {product.name.replace('Monster ', '')}
            </div>
            <div className="text-[6.5px] font-mono text-zinc-500 uppercase tracking-widest">
              {product.canSize.split('/')[0].trim()}
            </div>
          </div>

          {/* Out of stock or low stock banner across can */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-[1px] flex flex-col items-center justify-center z-20">
              <span className="bg-red-600/90 text-white font-black text-[9px] uppercase px-1.5 py-0.5 rounded tracking-wider shadow">
                EMPTY
              </span>
            </div>
          )}

          {isLowStock && (
            <div className="absolute top-1 right-1 z-20">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            </div>
          )}
        </div>

        {/* Can Lower Bevel & Base */}
        <div className="w-[88%] h-2 bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-800 rounded-b-sm z-10"></div>
        <div className="w-3/4 h-1.5 rounded-b-md bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-700 border-b border-zinc-500/30"></div>
      </div>

      {showDetails && (
        <div className="mt-2 text-center w-full">
          <p className="font-bold text-xs text-white truncate max-w-[140px]">{product.name}</p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span
              className={`text-xs font-mono font-bold ${
                isOutOfStock ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {product.stock} in stock
            </span>
            <span className="text-zinc-500 text-[10px]">•</span>
            <span className="text-zinc-400 text-xs font-medium">${product.unitPrice.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
