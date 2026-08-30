import React, { useState } from 'react';
import { 
  Cloud, 
  CheckCircle2, 
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
  X,
  Link as LinkIcon,
  Share2,
  Smartphone
} from 'lucide-react';
import { CloudHousehold, createNewHousehold, findHouseholdByCode, setCurrentHouseholdId } from '../utils/firebaseSync';
import { getParentPin } from '../utils/parentLock';
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
  const [newPassphrase, setNewPassphrase] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinPassphraseInput, setJoinPassphraseInput] = useState('');
  const [requiresPassphrasePrompt, setRequiresPassphrasePrompt] = useState(false);
  const [pendingHouseholdFound, setPendingHouseholdFound] = useState<CloudHousehold | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  if (!isOpen) return null;

  const getJoinUrl = () => {
    if (!activeHousehold?.householdCode) return window.location.origin;
    return `${window.location.origin}?join=${encodeURIComponent(activeHousehold.householdCode)}`;
  };

  const handleCopyCode = () => {
    if (activeHousehold?.householdCode) {
      navigator.clipboard.writeText(activeHousehold.householdCode);
      setCopiedCode(true);
      soundFX.playPop();
      onShowToast(`Family Code "${activeHousehold.householdCode}" copied to clipboard!`, 'success');
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleCopyLink = () => {
    const url = getJoinUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    soundFX.playPop();
    onShowToast('Direct Join Link copied! Send it via text/chat to other devices 📲', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
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
      const currentAdminPin = getParentPin();
      const created = await createNewHousehold(newFamilyName, newMotto, currentAdminPin, newPassphrase);
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
      setErrorMessage('Please enter a valid Family Code.');
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

      // If household has a join passphrase requirement
      if (found.joinPassphrase && found.joinPassphrase.trim().length > 0) {
        if (!requiresPassphrasePrompt || !joinPassphraseInput) {
          setRequiresPassphrasePrompt(true);
          setPendingHouseholdFound(found);
          setIsLoading(false);
          return;
        }

        if (joinPassphraseInput.trim() !== found.joinPassphrase.trim()) {
          setErrorMessage('Incorrect household password! Ask your family administrator.');
          soundFX.playPop();
          setIsLoading(false);
          return;
        }
      }

      soundFX.playStarChime(5);
      setCurrentHouseholdId(found.id);
      onHouseholdConnected(found);
      onShowToast(`Connected to "${found.familyName}" in real time! 🎉`, 'success');
      setRequiresPassphrasePrompt(false);
      setPendingHouseholdFound(null);
      setJoinPassphraseInput('');
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
        className={`rounded-3xl shadow-2xl border max-w-lg w-full overflow-hidden flex flex-col max-h-[88vh] ${
          theme.isDark 
            ? 'bg-slate-900 border-slate-800' 
            : 'bg-white border-slate-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Apple HIG Clean Visual Structure with Active Theme Respect */}
        <div className={`px-4 py-3 sm:px-5 sm:py-3.5 ${theme.heroBannerBg} text-white relative overflow-hidden border-b shrink-0 ${theme.heroBannerBorder || 'border-white/10'}`}>
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="space-y-0.5 min-w-0 pr-2">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 text-[9px] font-bold tracking-wider uppercase whitespace-nowrap shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Firebase Realtime Cloud
              </div>
              <h2 className="text-base font-extrabold tracking-tight text-white leading-tight">
                Family Cloud Sync
              </h2>
              <p className="text-[11px] text-white/90 leading-tight max-w-md">
                Sync profiles, chores, photo proof & points live across all family devices.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1 text-white/80 hover:text-white rounded-xl hover:bg-white/15 transition-colors cursor-pointer shrink-0 -mr-1 -mt-0.5 min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* iOS-Style Segmented Control Navigation */}
        <div className={`px-4 pt-2.5 sm:px-5 shrink-0 ${theme.isDark ? 'bg-slate-900' : 'bg-white'}`}>
          <div className={`p-1 rounded-xl flex gap-1 border ${theme.isDark ? 'bg-slate-800/80 border-slate-700/60' : 'bg-slate-100/90 border-slate-200/60'}`}>
            <button
              onClick={() => { soundFX.playPop(); setTab('status'); }}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                tab === 'status' 
                  ? (theme.isDark ? 'bg-slate-700 text-white shadow-2xs font-extrabold' : 'bg-white text-slate-900 shadow-2xs font-extrabold')
                  : (theme.isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')
              }`}
            >
              Status
            </button>
            <button
              onClick={() => { soundFX.playPop(); setTab('join'); }}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                tab === 'join' 
                  ? (theme.isDark ? 'bg-slate-700 text-white shadow-2xs font-extrabold' : 'bg-white text-slate-900 shadow-2xs font-extrabold')
                  : (theme.isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')
              }`}
            >
              Join Household
            </button>
            <button
              onClick={() => { soundFX.playPop(); setTab('create'); }}
              className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${
                tab === 'create' 
                  ? (theme.isDark ? 'bg-slate-700 text-white shadow-2xs font-extrabold' : 'bg-white text-slate-900 shadow-2xs font-extrabold')
                  : (theme.isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')
              }`}
            >
              Create New
            </button>
          </div>
        </div>

        {/* Content Body with Guaranteed Scroll & Spacing */}
        <div className={`p-4 overflow-y-auto space-y-3.5 flex-1 min-h-0 overscroll-contain pb-5 ${theme.isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-800'}`}>
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: STATUS */}
          {tab === 'status' && (
            <div className="space-y-3">
              {activeHousehold ? (
                <>
                  {/* Compact Apple Inset Status Row */}
                  <div className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 shadow-2xs ${
                    theme.isDark ? 'bg-slate-800/80 border-slate-700/60' : 'bg-slate-50 border-slate-200/80'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className={`font-extrabold text-sm truncate leading-tight ${theme.isDark ? 'text-white' : 'text-slate-900'}`}>
                          {activeHousehold.familyName}
                        </h3>
                        <p className={`text-[11px] truncate leading-tight mt-0.5 ${theme.isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {activeHousehold.houseAddressOrMotto || 'Live Multi-Device Sync'}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/80 whitespace-nowrap shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Sync Active
                    </span>
                  </div>

                  {/* Streamlined Family Join Code Card */}
                  <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl space-y-2.5 shadow-sm border border-slate-800">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                        <QrCode className="w-3.5 h-3.5 text-sky-400" />
                        Family Join Code
                      </span>
                      <span className="text-[11px] text-sky-300 font-semibold whitespace-nowrap">Share with family</span>
                    </div>

                    {/* Integrated Code + Quick Action Row */}
                    <div className="flex items-center justify-between gap-2 bg-slate-800/90 border border-slate-700/80 p-2 sm:p-2.5 rounded-xl">
                      <span className="font-mono text-xl sm:text-2xl font-black tracking-widest text-sky-300 select-all px-1 truncate">
                        {activeHousehold.householdCode}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={handleCopyCode}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-xs ${theme.primaryBg} ${theme.primaryText}`}
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                        </button>
                        <button
                          onClick={() => { soundFX.playPop(); setShowQRCode(!showQRCode); }}
                          className={`p-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                            showQRCode 
                              ? 'bg-sky-400 text-slate-950 border-sky-400' 
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                          title="Show QR Code"
                          aria-label="Toggle QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 1-Click Invite Link Action */}
                    <button
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 text-sky-300 border border-slate-700/70 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Share2 className="w-3.5 h-3.5 text-sky-400" />
                      <span>{copiedLink ? '✓ Invite Link Copied to Clipboard!' : 'Copy 1-Click Family Invite Link'}</span>
                    </button>

                    {/* QR Code Scan Overlay (Expandable) */}
                    {showQRCode && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-900 flex flex-col items-center gap-2 animate-in fade-in zoom-in-95">
                        <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                          Scan to Join Instantly
                        </p>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(getJoinUrl())}`}
                          alt="Family Join QR Code"
                          className="w-32 h-32 rounded-lg border border-slate-100 p-1 bg-white shadow-xs"
                        />
                        <p className="text-[10px] text-slate-400">
                          Or enter code <strong className="text-slate-800 font-mono">{activeHousehold.householdCode}</strong>
                        </p>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 leading-normal">
                      💡 Family members can tap <strong className="text-slate-200">Join Household</strong> and enter this code to sync in real time.
                    </p>
                  </div>

                  {/* Immediate Footer Options - Always Visible */}
                  <div className="pt-1 flex justify-between items-center text-xs">
                    <button
                      onClick={handleDisconnect}
                      className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline cursor-pointer min-h-[32px]"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Disconnect device
                    </button>
                    <button
                      onClick={() => { soundFX.playPop(); setTab('create'); }}
                      className={`font-semibold cursor-pointer min-h-[32px] flex items-center hover:underline ${theme.isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
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
              <div className="space-y-1.5">
                <label className={`text-xs font-bold uppercase tracking-wider ${theme.isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Enter Family Join Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => {
                      setJoinCodeInput(e.target.value.toUpperCase());
                      setRequiresPassphrasePrompt(false);
                    }}
                    placeholder="e.g. NEST-7K9X"
                    maxLength={12}
                    className={`w-full uppercase font-mono tracking-widest text-center text-lg font-black px-4 py-3 rounded-2xl border focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                      theme.isDark 
                        ? 'bg-slate-800 border-slate-700 text-sky-300' 
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                    autoFocus
                  />
                </div>
                <p className={`text-[11px] ${theme.isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ask the household creator for their code from the Cloud Sync status page.
                </p>
              </div>

              {/* Protected Household Password Challenge */}
              {requiresPassphrasePrompt && (
                <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-2 animate-in fade-in">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    🔒 Protected Household: Enter Family Password
                  </label>
                  <p className="text-[11px] text-amber-700">
                    "{pendingHouseholdFound?.familyName}" requires a password to join.
                  </p>
                  <input
                    type="password"
                    value={joinPassphraseInput}
                    onChange={(e) => setJoinPassphraseInput(e.target.value)}
                    placeholder="Enter family password"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-slate-900"
                    autoFocus
                  />
                </div>
              )}

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
                    {requiresPassphrasePrompt ? 'Unlock & Join Family' : 'Join Family Live'}
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: CREATE NEW HOUSEHOLD */}
          {tab === 'create' && (
            <form onSubmit={handleCreateHousehold} className="space-y-3.5">
              <div className="space-y-1">
                <label className={`text-xs font-bold ${theme.isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Family / Household Name
                </label>
                <input
                  type="text"
                  value={newFamilyName}
                  onChange={(e) => setNewFamilyName(e.target.value)}
                  placeholder="e.g. The Miller Family"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                    theme.isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-bold ${theme.isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Family Motto or Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={newMotto}
                  onChange={(e) => setNewMotto(e.target.value)}
                  placeholder="e.g. Clean spaces, happy smiles & teamwork! ✨"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                    theme.isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className={`text-xs font-bold flex items-center justify-between ${theme.isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>Household Join Password (Optional)</span>
                  <span className={`text-[10px] font-normal ${theme.isDark ? 'text-slate-400' : 'text-slate-400'}`}>Extra privacy protection</span>
                </label>
                <input
                  type="password"
                  value={newPassphrase}
                  onChange={(e) => setNewPassphrase(e.target.value)}
                  placeholder="e.g. secret123 (Leave blank for code-only access)"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 ${
                    theme.isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className={`p-3 rounded-xl border text-[11px] flex items-center gap-2 ${
                theme.isDark 
                  ? 'bg-amber-950/40 border-amber-800/60 text-amber-200' 
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  High-entropy codes and optional passwords guarantee no random stranger can guess or access your family's data.
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
