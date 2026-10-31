import React from 'react';
import { User } from '../types';
import { Zap, Wifi, WifiOff, User as UserIcon, BookOpen, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  isSynced: boolean;
  onOpenUserModal: () => void;
  onOpenSetupGuide: () => void;
  onQuickSwitchUser: (role: 'admin' | 'staff') => void;
  lowStockAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  isSynced,
  onOpenUserModal,
  onOpenSetupGuide,
  onQuickSwitchUser,
  lowStockAlertCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090b0d]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Claw */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-black border border-emerald-500/40 flex items-center justify-center glow-green-sm shadow-inner group">
            {/* Monster 3-claw neon green logo */}
            <svg
              viewBox="0 0 100 120"
              className="w-5 h-6 filter drop-shadow-[0_0_6px_#00ff41]"
              fill="#00ff41"
            >
              <path d="M18 10 C16 35, 14 70, 26 110 C29 90, 31 55, 34 25 C30 20, 24 15, 18 10 Z" />
              <path d="M44 4 C42 40, 40 85, 52 118 C56 95, 58 50, 60 18 C54 13, 49 8, 44 4 Z" />
              <path d="M72 16 C69 45, 68 75, 80 105 C83 85, 85 58, 86 32 C81 26, 76 21, 72 16 Z" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-wider text-base sm:text-lg text-white font-mono flex items-center gap-1.5">
                MONSTER <span className="text-[#00ff41] glow-green-text">STOCK</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono tracking-widest font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                PRO v2.6
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-zinc-400 font-medium">
              Multi-Device Real-Time Inventory & Sales Cloud
            </p>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Real-time Cloud Sync Pill */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
              isSynced
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40 glow-green-sm'
                : 'bg-zinc-900 text-zinc-400 border-zinc-700'
            }`}
            title="Real-time Server-Sent Events cloud synchronisation is active across all devices"
          >
            {isSynced ? (
              <>
                <span className="h-2 w-2 rounded-full bg-[#00ff41] animate-ping" />
                <Wifi className="w-3.5 h-3.5 text-[#00ff41]" />
                <span className="text-[11px]">CLOUD SYNCED</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[11px]">CONNECTING...</span>
              </>
            )}
          </div>

          {/* Low Stock Urgent Counter */}
          {lowStockAlertCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-amber-950/50 text-amber-300 border border-amber-500/40 text-xs font-mono font-semibold"
              title={`${lowStockAlertCount} flavours currently low or out of stock`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>{lowStockAlertCount} Low Stock</span>
            </div>
          )}

          {/* Setup Guide Button */}
          <button
            onClick={onOpenSetupGuide}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/80 text-xs font-medium transition cursor-pointer"
            title="Open Setup & Multi-Device Deployment Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Setup Guide</span>
          </button>

          {/* Quick User Role Switcher for Multi-User testing */}
          <div className="hidden lg:flex items-center bg-black/60 p-0.5 rounded-lg border border-zinc-800 text-xs font-mono">
            <button
              onClick={() => onQuickSwitchUser('admin')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                currentUser?.role === 'admin'
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => onQuickSwitchUser('staff')}
              className={`px-2 py-1 rounded transition cursor-pointer ${
                currentUser?.role === 'staff'
                  ? 'bg-cyan-500 text-black font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Staff
            </button>
          </div>

          {/* Current User Profile Pill */}
          <button
            onClick={onOpenUserModal}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 transition cursor-pointer text-left"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-black"
              style={{ backgroundColor: currentUser?.avatarColor || '#00ff41' }}
            >
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-white leading-tight truncate max-w-[110px]">
                {currentUser?.name?.split(' ')[0] || 'User'}
              </p>
              <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
                {currentUser?.role || 'staff'}
              </p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
