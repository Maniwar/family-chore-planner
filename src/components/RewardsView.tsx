import React, { useState } from 'react';
import { 
  Award, 
  Gift, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  X, 
  Trash2, 
  DollarSign, 
  Gamepad2, 
  Film, 
  IceCream, 
  Moon 
} from 'lucide-react';
import { RewardItem, RewardClaim, HouseholdMember } from '../types';

interface RewardsViewProps {
  rewards: RewardItem[];
  claims: RewardClaim[];
  members: HouseholdMember[];
  isMomMode: boolean;
  onClaimReward: (rewardId: string, memberId: string) => void;
  onApproveClaim: (claimId: string) => void;
  onDeliverClaim: (claimId: string) => void;
  onAddNewReward: (reward: Omit<RewardItem, 'id'>) => void;
  onDeleteReward: (rewardId: string) => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({
  rewards,
  claims,
  members,
  isMomMode,
  onClaimReward,
  onApproveClaim,
  onDeliverClaim,
  onAddNewReward,
  onDeleteReward,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [claimModalReward, setClaimModalReward] = useState<RewardItem | null>(null);
  const [selectedClaimMemberId, setSelectedClaimMemberId] = useState<string>(
    members.find(m => m.role !== 'parent')?.id || members[0]?.id || ''
  );

  // New reward form state
  const [newTitle, setNewTitle] = useState('');
  const [newPoints, setNewPoints] = useState(50);
  const [newCategory, setNewCategory] = useState<'treat' | 'allowance' | 'screentime' | 'activity' | 'privilege'>('treat');
  const [newDesc, setNewDesc] = useState('');

  const pendingClaims = claims.filter(c => c.status === 'pending');
  const pastClaims = claims.filter(c => c.status !== 'pending').slice(0, 10);

  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddNewReward({
      title: newTitle.trim(),
      pointCost: Number(newPoints) || 50,
      category: newCategory,
      description: newDesc.trim(),
      icon: 'Gift',
    });

    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewPoints(50);
  };

  const handleConfirmClaim = () => {
    if (!claimModalReward || !selectedClaimMemberId) return;
    onClaimReward(claimModalReward.id, selectedClaimMemberId);
    setClaimModalReward(null);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'screentime': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'activity': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'treat': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'allowance': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center text-xl shadow-xs">
            🏆
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Family Rewards & Point Store
            </h2>
            <p className="text-xs text-slate-500">
              Redeem chore completion points for allowance, screen time, outings, and special treats
            </p>
          </div>
        </div>

        {isMomMode && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Reward</span>
          </button>
        )}
      </div>

      {/* Family Points Balances Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Available Points to Spend:
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {members.map((member) => (
            <div key={member.id} className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">{member.avatarEmoji}</span>
                <span className="text-xs font-bold truncate">{member.name.split(' ')[0]}</span>
              </div>
              <div className="text-xl font-extrabold text-amber-300">
                {member.currentPoints} <span className="text-xs font-normal text-slate-300">pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Claims Queue */}
      {pendingClaims.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-300 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pending Reward Requests ({pendingClaims.length})</span>
            </h3>
            <span className="text-xs text-amber-700 font-semibold">
              {isMomMode ? "Mom's Approval Needed" : "Waiting for Mom's Review"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingClaims.map((claim) => (
              <div key={claim.id} className="bg-white p-3.5 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">{claim.memberName}</span>
                    <span className="text-xs text-amber-800 font-semibold">({claim.pointCost} pts)</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">{claim.rewardTitle}</p>
                </div>

                <div className="flex items-center gap-1.5">
                  {isMomMode ? (
                    <button
                      onClick={() => onApproveClaim(claim.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Approve
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-1 rounded-md">
                      Pending Review ⏳
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards Catalog */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">Available Reward Items:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCategoryBadge(reward.category)}`}>
                    {reward.category}
                  </span>

                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-200 shadow-xs">
                    ⭐ {reward.pointCost} pts
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 mb-1 leading-snug">
                  {reward.title}
                </h4>

                <p className="text-xs text-slate-500 mb-4">
                  {reward.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setClaimModalReward(reward)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Redeem This Reward</span>
                </button>

                {isMomMode && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${reward.title}" from rewards catalog?`)) {
                        onDeleteReward(reward.id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Claim Modal */}
      {claimModalReward && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Claim Reward</h3>
              <button onClick={() => setClaimModalReward(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs font-bold text-amber-900">{claimModalReward.title}</p>
              <p className="text-xs text-amber-700 font-extrabold mt-0.5">Cost: {claimModalReward.pointCost} points</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Who is claiming this reward?
              </label>
              <select
                value={selectedClaimMemberId}
                onChange={(e) => setSelectedClaimMemberId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id} disabled={m.currentPoints < claimModalReward.pointCost}>
                    {m.avatarEmoji} {m.name} ({m.currentPoints} pts available) {m.currentPoints < claimModalReward.pointCost ? '— Not enough pts' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setClaimModalReward(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClaim}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
              >
                Confirm Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Reward Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Family Reward</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReward} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Reward Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pizza Night Topping Choice"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Point Cost
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={newPoints}
                    onChange={(e) => setNewPoints(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-amber-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                  >
                    <option value="treat">🍦 Treat / Food</option>
                    <option value="screentime">🎮 Screen Time</option>
                    <option value="activity">🎟️ Outing / Activity</option>
                    <option value="allowance">💵 Cash Allowance</option>
                    <option value="privilege">🌟 Special Privilege</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Rules or instructions for redeeming this reward"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                >
                  Save Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
