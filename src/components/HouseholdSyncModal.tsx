import React, { useState } from 'react';
import { 
  Cloud, 
  CloudCheck, 
  Users, 
  QrCode, 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles, 
  ShieldAlert, 
  Home, 
  PlusCircle,
  RefreshCw,
  LogOut,
  X
} from 'lucide-react';
import { CloudHousehold, createNewHousehold, findHouseholdByCode, setCurrentHouseholdId } from '../utils/firebaseSync';
import { HouseholdInfo } from '../types';
import { ThemePreset, THEMES } from '../utils/theme';
import { soundFX } from '../utils/audio';

interface HouseholdSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdInfo: HouseholdInfo;
  activeHousehold: CloudHousehold | null;
  currentTheme?: ThemePreset;
  onHouseholdConnected: (household: CloudHousehold) => void;
  onHouseholdDisconnected: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export const HouseholdSyncModal: React.FC<HouseholdSyncModalProps> = ({
  isOpen,
  onClose,
  householdInfo,
  activeHousehold,
  currentTheme = 'rose',
  onHouseholdConnected,
  onHouseholdDisconnected,
  onShowToast,
}) => {
  const theme = THEMES[currentTheme] || THEMES.rose;
  const [tab, setTab] = useState<'status' | 'create' | 'join'>('status');
  const [newFamilyName, setNewFamilyName] = useState(householdInfo.familyName || 'Our Family Home');
  const [newMotto, setNewMotto] = useState(householdInfo.houseAddressOrMotto || 'Clean spaces, happy smiles & teamwork! ✨');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (activeHousehold?.householdCode) {
      navigator.clipboard.writeText(activeHousehold.householdCode);
      setCopiedCode(true);
      soundFX.playPop();
      onShowToast(`Family Code "${activeHousehold.householdCode}" copied to clipboard!`, 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) {
      setErrorMessage('Please enter a family or household name.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      soundFX.playFanfare();
      const created = await createNewHousehold(newFamilyName, newMotto);
      onHouseholdConnected(created);
      onShowToast(`Created cloud household for "${created.familyName}"! Join code: ${created.householdCode}`, 'success');
      setTab('status');
    } catch (err) {
      console.error('Failed to create household', err);
      setErrorMessage('Failed to create household. Please check internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMessage('Please enter a 6-character Family Code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const found = await findHouseholdByCode(cleanCode);
      if (!found) {
        setErrorMessage(`No household found with code "${cleanCode}". Double check and try again!`);
        soundFX.playPop();
        return;
      }

      soundFX.playStarChime(5);
      setCurrentHouseholdId(found.id);
      onHouseholdConnected(found);
      onShowToast(`Connected to "${found.familyName}" in real time! 🎉`, 'success');
      setTab('status');
    } catch (err) {
      console.error('Failed to join household', err);
      setErrorMessage('Error connecting to cloud. Please check code or connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Disconnect from this cloud household? Your device will revert to local standalone mode.')) {
      soundFX.playPop();
      setCurrentHouseholdId(null);
      onHouseholdDisconnected();
      onShowToast('Disconnected from cloud sync. Now in local mode.', 'info');
      setTab('join');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 sm:p-6 ${theme.heroBannerBg} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
              ☁️
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Multi-Family Cloud Sync
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/25 font-bold uppercase tracking-wider">
                  Firebase Live
                </span>
              </h2>
              <p className="text-xs text-white/80">
                Sync kids, chores & point approvals live across all phones & tablets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/80 px-4 pt-2 gap-1">
          <button
            onClick={() => { soundFX.playPop(); setTab('status'); }}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer ${
              tab === 'status' 
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Household Status
          </button>
          <button
            onClick={() => { soundFX.playPop(); setTab('join'); }}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer ${
              tab === 'join' 
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Join with Family Code
          </button>
          <button
            onClick={() => { soundFX.playPop(); setTab('create'); }}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl transition-colors cursor-pointer ${
              tab === 'create' 
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Create New Household
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: STATUS */}
          {tab === 'status' && (
            <div className="space-y-4">
              {activeHousehold ? (
                <>
                  <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <CloudCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-sm">{activeHousehold.familyName}</h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Live Sync Active
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{activeHousehold.houseAddressOrMotto || 'Multi-device synchronized'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Shareable Family Code Box */}
                  <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3 shadow-sm">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-cyan-400" />
                        Family Join Code
                      </span>
                      <span className="text-[11px] text-cyan-300 font-semibold">Share with family</span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-800/90 border border-slate-700 p-3 rounded-xl">
                      <span className="font-mono text-2xl font-black tracking-widest text-cyan-300">
                        {activeHousehold.householdCode}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      💡 Family members can open this app on their phone or tablet, click <strong className="text-white">Cloud Sync</strong>, and enter this code to join in real time!
                    </p>
                  </div>

                  {/* Options */}
                  <div className="pt-2 flex justify-between items-center text-xs">
                    <button
                      onClick={handleDisconnect}
                      className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Disconnect this device
                    </button>
                    <button
                      onClick={() => { soundFX.playPop(); setTab('create'); }}
                      className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                    >
                      Switch household →
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-2xl">
                    🏠
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Standalone Local Mode</h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                      Your chore schedule is currently stored on this device only. Connect to Firebase to sync across everyone's phones!
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
                    <button
                      onClick={() => { soundFX.playPop(); setTab('create'); }}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs ${theme.primaryBg} ${theme.primaryText} shadow-xs hover:opacity-90 flex items-center justify-center gap-1.5 cursor-pointer`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      Create Cloud Household
                    </button>
                    <button
                      onClick={() => { soundFX.playPop(); setTab('join'); }}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-4 h-4" />
                      Join with Code
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: JOIN WITH CODE */}
          {tab === 'join' && (
            <form onSubmit={handleJoinHousehold} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Enter 6-Character Family Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. HOME-7842"
                    maxLength={10}
                    className="w-full uppercase font-mono tracking-widest text-center text-lg font-black px-4 py-3 rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-slate-50"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Ask the household creator for their code from the Cloud Sync status page.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !joinCodeInput.trim()}
                className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isLoading || !joinCodeInput.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : `${theme.primaryBg} ${theme.primaryText} shadow-md hover:opacity-90 active:scale-[0.99]`
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Join Family Live
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: CREATE NEW HOUSEHOLD */}
          {tab === 'create' && (
            <form onSubmit={handleCreateHousehold} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Family / Household Name</label>
                <input
                  type="text"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  placeholder="e.g. The Miller Family"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Family Motto or Subtitle (Optional)</label>
                <input
                  type="text"
                  value={newMotto}
                  onChange={(e) => setNewMotto(e.target.value)}
                  placeholder="e.g. Clean spaces, happy smiles & teamwork! ✨"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Creating a cloud household gives you a unique 6-character code that other families or devices can join!
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isLoading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : `${theme.primaryBg} ${theme.primaryText} shadow-md hover:opacity-90 active:scale-[0.99]`
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Provisioning Household...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Create Cloud Household & Code
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
