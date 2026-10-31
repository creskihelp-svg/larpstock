import React, { useState } from 'react';
import { User } from '../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Clock, 
  TrendingUp, 
  Mail, 
  Key, 
  CheckCircle2, 
  X,
  ArrowRightLeft
} from 'lucide-react';

interface TeamViewProps {
  users: User[];
  currentUser: User | null;
  onRegisterUser: (name: string, email: string, password: string, role: 'admin' | 'staff') => Promise<void>;
  onSwitchUser: (user: User) => void;
  currencySymbol: string;
}

export const TeamView: React.FC<TeamViewProps> = ({
  users,
  currentUser,
  onRegisterUser,
  onSwitchUser,
  currencySymbol,
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Monster2026!');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onRegisterUser(name, email, password, role);
      setShowInviteModal(false);
      setName('');
      setEmail('');
      setPassword('Monster2026!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12">
      {/* Team Header & Actions */}
      <div className="bg-[#0f1214] border border-zinc-800 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00ff41]" />
            <h3 className="font-bold text-base sm:text-lg text-white">
              Monster Stock Team Members
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            All registered users share access to the same synchronized live cloud inventory.
          </p>
        </div>

        <button
          onClick={() => {
            setShowInviteModal(true);
            setErrorMsg(null);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#00ff41] hover:bg-[#00e63a] text-black font-black text-xs uppercase tracking-wider glow-green transition cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4 fill-black" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Multi-Device Sync Explanation Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 text-xs text-zinc-300">
        <p className="font-bold text-white mb-1 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Multi-User Cloud Synchronisation
        </p>
        <p className="text-zinc-400 leading-relaxed">
          Open this app on multiple phones, tablets, or separate browser windows. Log in with different accounts below. When one person records a sale or adds stock, all team members will immediately see the updated inventory quantity without reloading!
        </p>
      </div>

      {/* Users Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const isCurrent = currentUser?.id === user.id;

          return (
            <div
              key={user.id}
              className={`bg-[#0f1214] border rounded-xl p-5 relative overflow-hidden transition-all duration-200 hover:border-zinc-700 ${
                isCurrent
                  ? 'border-emerald-500/70 shadow-lg shadow-emerald-950/20'
                  : 'border-zinc-800'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-0 right-0 bg-[#00ff41] text-black text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-bl-lg font-mono">
                  ACTIVE SESSION
                </div>
              )}

              <div className="flex items-start gap-3.5 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg text-black shadow-md shrink-0"
                  style={{ backgroundColor: user.avatarColor || '#00ff41' }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm sm:text-base text-white truncate" title={user.name}>
                    {user.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate mt-0.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                        user.role === 'admin'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-500/40'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      }`}
                    >
                      {user.role}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Member since {new Date(user.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-lg bg-black/60 border border-zinc-800/80 text-xs font-mono">
                <div>
                  <span className="text-zinc-500 block text-[9.5px] uppercase">Transactions</span>
                  <span className="font-bold text-white text-sm">{user.salesCount || 0}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9.5px] uppercase">Cans Sold</span>
                  <span className="font-bold text-emerald-400 text-sm">{user.unitsSold || 0}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-zinc-800/60 flex justify-between items-center text-[11px]">
                  <span className="text-zinc-400">Total Revenue:</span>
                  <span className="font-bold text-white">
                    {currencySymbol}{(user.totalRevenue || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Switch User Button (useful for easy multi-user testing) */}
              {!isCurrent ? (
                <button
                  onClick={() => onSwitchUser(user)}
                  className="w-full py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-mono font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Switch to this Account</span>
                </button>
              ) : (
                <div className="text-center py-1.5 text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 rounded-lg border border-emerald-500/20">
                  ✓ Currently logged in
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite / Register User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121518] border border-zinc-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-950 text-[#00ff41] border border-emerald-500/40">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Register Team Member</h3>
                <p className="text-xs text-zinc-400">
                  Create credentials for a new colleague or shift lead.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 text-xs text-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Taylor Reed"
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#00ff41]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. taylor@monster.energy"
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#00ff41]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                  Password
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Temporary password"
                  className="w-full bg-black/60 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-[#00ff41]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1">
                  Role & Permissions
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('staff')}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-left transition cursor-pointer ${
                      role === 'staff'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : 'bg-black/40 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    <span className="block font-bold text-white">Staff Lead</span>
                    <span className="text-[10px] text-zinc-400">Can record sales & adjust stock</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-left transition cursor-pointer ${
                      role === 'admin'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : 'bg-black/40 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    <span className="block font-bold text-white">Administrator</span>
                    <span className="text-[10px] text-zinc-400">Full system & settings control</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#00ff41] hover:bg-[#00e63a] text-black font-black text-xs uppercase tracking-wider glow-green-sm cursor-pointer"
                >
                  {isSubmitting ? 'Creating...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
