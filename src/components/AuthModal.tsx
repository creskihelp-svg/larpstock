import React, { useState } from 'react';
import { User } from '../types';
import { X, Lock, Mail, User as UserIcon, Shield, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string, role: 'admin' | 'staff') => Promise<void>;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onRegister,
  onLogout,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(name, email, password, role);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickDemo = (type: 'admin' | 'staff') => {
    if (type === 'admin') {
      setEmail('admin@monster.energy');
      setPassword('Monster2026!');
    } else {
      setEmail('staff@monster.energy');
      setPassword('Monster2026!');
    }
    setMode('login');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121518] border border-zinc-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-black border border-emerald-500/40 flex items-center justify-center glow-green-sm">
            <Lock className="w-5 h-5 text-[#00ff41]" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">
              {currentUser ? 'User Profile & Session' : mode === 'login' ? 'Team Member Sign In' : 'Register New Account'}
            </h3>
            <p className="text-xs text-zinc-400">
              {currentUser ? `Signed in as ${currentUser.name}` : 'Shared Cloud Inventory Authentication'}
            </p>
          </div>
        </div>

        {/* Current User Card if logged in */}
        {currentUser && (
          <div className="p-4 rounded-xl bg-black/60 border border-zinc-800 space-y-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black text-sm"
                style={{ backgroundColor: currentUser.avatarColor || '#00ff41' }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-zinc-400 truncate">{currentUser.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                }}
                className="text-xs font-mono text-red-400 hover:text-red-300 font-bold transition cursor-pointer"
              >
                Sign Out of This Device
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-mono text-white hover:bg-zinc-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Login / Register Form */}
        {!currentUser && (
          <>
            {/* Quick Demo Fill Buttons */}
            <div className="mb-4 p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
              <span className="text-zinc-400 block mb-1.5 font-mono text-[10.5px]">Quick Pre-Configured Accounts:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickDemo('admin')}
                  className="flex-1 py-1 px-2 rounded bg-black hover:bg-zinc-800 text-[#00ff41] border border-emerald-500/40 text-[11px] font-mono font-bold transition cursor-pointer"
                >
                  Fill Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('staff')}
                  className="flex-1 py-1 px-2 rounded bg-black hover:bg-zinc-800 text-cyan-400 border border-cyan-500/40 text-[11px] font-mono font-bold transition cursor-pointer"
                >
                  Fill Staff
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 text-xs text-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Vance"
                    className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ff41]"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@monster.energy"
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00ff41]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#00ff41]"
                  required
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                    Account Role
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('staff')}
                      className={`flex-1 py-1.5 rounded text-xs font-bold border transition cursor-pointer ${
                        role === 'staff'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                          : 'bg-black text-zinc-400 border-zinc-800'
                      }`}
                    >
                      Staff Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`flex-1 py-1.5 rounded text-xs font-bold border transition cursor-pointer ${
                        role === 'admin'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                          : 'bg-black text-zinc-400 border-zinc-800'
                      }`}
                    >
                      Administrator
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-lg bg-[#00ff41] hover:bg-[#00e63a] text-black font-black text-xs uppercase tracking-wider glow-green transition cursor-pointer mt-2"
              >
                {isLoading
                  ? 'Connecting...'
                  : mode === 'login'
                  ? 'Sign In to Cloud Inventory'
                  : 'Register Account'}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-zinc-800 text-center text-xs">
              {mode === 'login' ? (
                <p className="text-zinc-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg(null);
                    }}
                    className="text-[#00ff41] hover:underline font-bold cursor-pointer"
                  >
                    Register here
                  </button>
                </p>
              ) : (
                <p className="text-zinc-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    className="text-[#00ff41] hover:underline font-bold cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
