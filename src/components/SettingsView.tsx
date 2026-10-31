import React, { useState } from 'react';
import { StoreSettings, User } from '../types';
import { 
  Sliders, 
  ShieldAlert, 
  DollarSign, 
  Volume2, 
  VolumeX, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  BookOpen, 
  Server, 
  Database, 
  Users, 
  Globe, 
  ExternalLink,
  Cpu,
  Lock,
  Layers
} from 'lucide-react';

interface SettingsViewProps {
  settings: StoreSettings;
  currentUser: User | null;
  onUpdateSettings: (settings: Partial<StoreSettings>) => Promise<void>;
  onResetCatalog: () => Promise<void>;
  onClearAllValues: () => Promise<void>;
  isSynced: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onUpdateSettings,
  onResetCatalog,
  onClearAllValues,
  isSynced,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'guide'>('settings');

  // Form states
  const [storeName, setStoreName] = useState(settings.storeName);
  const [lowStockThreshold, setLowStockThreshold] = useState(settings.defaultLowStockThreshold);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundAlertsEnabled);

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset & Clear confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await onUpdateSettings({
        storeName,
        defaultLowStockThreshold: lowStockThreshold,
        currencySymbol,
        soundAlertsEnabled: soundEnabled,
      });
      setSuccessMsg('Settings saved and synchronized successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    setErrorMsg(null);
    try {
      await onResetCatalog();
      setShowResetConfirm(false);
      setSuccessMsg('Catalogue successfully reset to original 23 flavours with demo data!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset catalogue');
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmClear = async () => {
    setIsClearing(true);
    setErrorMsg(null);
    try {
      await onClearAllValues();
      setShowClearConfirm(false);
      setSuccessMsg('All inventory stock, sales records, and statistics cleared to zero!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to clear values');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-5xl mx-auto">
      {/* Top Navigation Switcher between General Settings and Setup Guide */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#00ff41] text-black glow-green-sm'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>General Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeTab === 'guide'
              ? 'bg-[#00ff41] text-black glow-green-sm'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Interactive Setup Guide</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-xs text-emerald-300 flex items-center gap-2 glow-green-sm">
          <CheckCircle2 className="w-4 h-4 text-[#00ff41]" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-xs text-red-200">
          {errorMsg}
        </div>
      )}

      {activeTab === 'settings' ? (
        <div className="space-y-6">
          {/* Cloud Synchronisation Diagnostics */}
          <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-5 shadow-lg">
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2 mb-3">
              <Server className="w-4 h-4 text-[#00ff41]" />
              Cloud Synchronisation & Backend Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-black/60 border border-zinc-800">
                <span className="text-zinc-500 block uppercase text-[10px]">Real-Time SSE Stream</span>
                <span className="font-bold flex items-center gap-1.5 mt-0.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-[#00ff41] animate-ping" />
                  {isSynced ? 'ONLINE & SYNCING' : 'CONNECTING...'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-black/60 border border-zinc-800">
                <span className="text-zinc-500 block uppercase text-[10px]">Concurrency Protection</span>
                <span className="font-bold text-white mt-0.5 block">
                  Atomic Mutex Active
                </span>
              </div>
              <div className="p-3 rounded-lg bg-black/60 border border-zinc-800">
                <span className="text-zinc-500 block uppercase text-[10px]">Cloud Run Persistence</span>
                <span className="font-bold text-cyan-300 mt-0.5 block">
                  JSON Store /data/monster_store.json
                </span>
              </div>
            </div>
          </div>

          {/* Store Settings Form */}
          <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-5 shadow-lg">
            <h3 className="font-bold text-sm sm:text-base text-white mb-4">
              Inventory & Alert Preferences
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                  Store / Hub Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-black/60 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff41]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                    Default Low-Stock Warning Threshold (Cans)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 5)}
                    className="w-full bg-black/60 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#00ff41]"
                    required
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Default is 5 cans. Flavours at or below this count will trigger glowing alert badges.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#00ff41]"
                    required
                  />
                </div>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-[#00ff41]" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-zinc-500" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-white block">Auditory Feedback</span>
                    <span className="text-[11px] text-zinc-400">
                      Play acoustic chime when sales or restocks are successfully synchronised.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-lg bg-[#00ff41] hover:bg-[#00e63a] text-black font-black text-xs uppercase tracking-wider glow-green transition cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save System Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Backup & Dangerous Actions */}
          <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-sm sm:text-base text-white">
              Data Backup & Factory Reset
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Export Backup */}
              <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white uppercase font-mono">
                    Download Full JSON Backup
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Export products, inventory levels, transaction histories, and activity audit logs into a portable JSON file.
                  </p>
                </div>
                <a
                  href="/api/admin/export"
                  download="monster-stock-backup.json"
                  className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-mono font-bold transition border border-zinc-700 text-center"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Backup JSON</span>
                </a>
              </div>

              {/* Clear All Values (Fresh Baseline) */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-amber-300 uppercase font-mono">
                    Clear All Values (Zero Out)
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Set all 23 flavour stock counts to 0, reset total sales to 0, and clear transaction history for a fresh start.
                  </p>
                </div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono uppercase tracking-wider rounded-lg transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Values to 0</span>
                </button>
              </div>

              {/* Reset Catalogue Seed */}
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-red-300 uppercase font-mono">
                    Reset to 23 Default Flavours
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    Restore all 23 original Monster Energy drink products with standard starting stock and demo seed data.
                  </p>
                </div>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-950 hover:bg-red-900 text-red-200 border border-red-800/80 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                  <span>Reset Demo Seed</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* INTERACTIVE SETUP GUIDE */
        <div className="space-y-6">
          <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-6 shadow-xl space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-5 h-5 text-[#00ff41]" />
                <h3 className="font-black text-lg text-white">
                  Monster Stock Manager — Operational Setup Guide
                </h3>
              </div>
              <p className="text-xs text-zinc-400">
                A simple, non-technical walkthrough for configuring the cloud database, managing multi-user access, and publishing your live stock system.
              </p>
            </div>

            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                <span className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-xs font-mono">
                  1
                </span>
                <span>Real-Time Cloud Architecture (Already Operational)</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed pl-8">
                Your Monster Stock Manager backend is hosted as a full-stack container on Google Cloud Run. It features:
              </p>
              <ul className="list-disc pl-12 text-xs text-zinc-400 space-y-1">
                <li><strong>Real-time SSE Stream:</strong> Every stock addition, sale, or reversal broadcasts instantly to all connected phones, tablets, and computers.</li>
                <li><strong>Atomic Mutex Transactions:</strong> Simultaneous sales are queued and processed sequentially. The system mathematically guarantees that inventory can never be oversold beyond available stock.</li>
                <li><strong>Local Disk Persistence:</strong> Stock data persists safely in <code className="text-emerald-400">data/monster_store.json</code> across reboots and browser refreshes.</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
                <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-xs font-mono">
                  2
                </span>
                <span>First Admin & Team User Accounts</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed pl-8">
                Two default accounts are preloaded for immediate multi-user testing:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-8 text-xs font-mono">
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-emerald-400 font-bold block mb-1">Chief Ops (Administrator)</span>
                  <span className="text-zinc-400 block">Email: admin@monster.energy</span>
                  <span className="text-zinc-400 block">Password: Monster2026!</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                  <span className="text-cyan-400 font-bold block mb-1">Shift Lead (Staff Member)</span>
                  <span className="text-zinc-400 block">Email: staff@monster.energy</span>
                  <span className="text-zinc-400 block">Password: Monster2026!</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 pl-8 pt-1">
                To add your own staff, navigate to the <strong>Team</strong> tab and click <strong>"Add Team Member"</strong>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                <span className="w-6 h-6 rounded-full bg-amber-950 border border-amber-500/40 flex items-center justify-center text-xs font-mono">
                  3
                </span>
                <span>Connecting External Cloud Databases (Supabase / Firebase)</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed pl-8">
                If you ever want to migrate from the built-in Express persistent cloud to a standalone Supabase or Firebase project:
              </p>
              <div className="pl-8 text-xs text-zinc-400 space-y-2">
                <p>
                  <strong>For Supabase:</strong> Create a project on <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline">supabase.com</a>. Create tables for <code className="text-zinc-300">products</code> and <code className="text-zinc-300">sales</code>, and set your <code className="text-zinc-300">SUPABASE_URL</code> and <code className="text-zinc-300">SUPABASE_ANON_KEY</code> in your environment variables.
                </p>
                <p>
                  <strong>For Firebase:</strong> Go to the Firebase Console, create a new project, enable Firestore Database, and paste your Firebase Web App configuration into <code className="text-zinc-300">firebase-applet-config.json</code>.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-purple-400">
                <span className="w-6 h-6 rounded-full bg-purple-950 border border-purple-500/40 flex items-center justify-center text-xs font-mono">
                  4
                </span>
                <span>Publishing & Deployment</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed pl-8">
                This app is already running live at your Cloud Run App URL:
              </p>
              <div className="pl-8">
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-400 break-all">
                  https://ais-dev-zwu6ip5tpgpzhhsqfk35qf-777455864926.asia-east1.run.app
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  Share this URL with your bar, gym, or warehouse staff. Anyone on mobile or desktop can immediately start managing stock together!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121518] border border-red-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-white">Reset Catalogue to Defaults?</h3>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              This will reset all 23 Monster flavours back to original preloaded stock counts and seed sales records. Are you sure you want to proceed?
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider font-mono cursor-pointer"
              >
                {isResetting ? 'Resetting...' : 'Yes, Reset Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Values Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121518] border border-amber-500/50 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-white">Clear All Stock & Sales to Zero?</h3>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              This will set the current stock of all 23 Monster flavours to <strong>0</strong>, reset total sold and stock received to <strong>0</strong>, and clear all past sales transaction records. All 23 flavour definitions will be preserved for fresh entry.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                disabled={isClearing}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider font-mono cursor-pointer"
              >
                {isClearing ? 'Clearing...' : 'Yes, Clear All to 0'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
