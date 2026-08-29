import React, { useState, useRef } from 'react';
import { X, Home, Camera, Trash2, Check, Sparkles, Lock, KeyRound, ShieldCheck, RotateCcw, AlertTriangle, ChevronRight } from 'lucide-react';
import { HouseholdInfo } from '../types';
import { processImageFile } from '../utils/imageUpload';
import { soundFX } from '../utils/audio';
import { getParentPin, setParentPin, isPinProtectionEnabled, setPinProtectionEnabled } from '../utils/parentLock';

interface HouseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdInfo: HouseholdInfo;
  onSaveHouseholdInfo: (info: HouseholdInfo) => void;
  onOpenPinChange?: () => void;
  onResetDemo?: () => void;
}

export const HouseSettingsModal: React.FC<HouseSettingsModalProps> = ({
  isOpen,
  onClose,
  householdInfo,
  onSaveHouseholdInfo,
  onResetDemo,
}) => {
  if (!isOpen) return null;

  const [familyName, setFamilyName] = useState(householdInfo.familyName || 'Our Family Home');
  const [houseAddressOrMotto, setHouseAddressOrMotto] = useState(
    householdInfo.houseAddressOrMotto || 'Clean spaces, happy smiles & teamwork! ✨'
  );
  const [housePhotoUrl, setHousePhotoUrl] = useState<string | undefined>(householdInfo.housePhotoUrl);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Parent PIN Settings
  const [isPinEnabled, setIsPinEnabled] = useState<boolean>(() => isPinProtectionEnabled());
  const [isEditingPin, setIsEditingPin] = useState<boolean>(false);
  const [customPinInput, setCustomPinInput] = useState<string>('');
  const [pinNotice, setPinNotice] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setUploadError(null);
    try {
      const result = await processImageFile(file, 900, 0.85);
      setHousePhotoUrl(result.dataUrl);
      soundFX.playPop();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process house photo');
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setHousePhotoUrl(undefined);
    soundFX.playPop();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveHouseholdInfo({
      familyName: familyName.trim() || 'Our Family Home',
      houseAddressOrMotto: houseAddressOrMotto.trim(),
      housePhotoUrl: housePhotoUrl || undefined,
    });
    soundFX.playComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        id="house-settings-modal"
        className="bg-slate-50 dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[90vh]"
      >
        {/* Apple HIG Modal Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center text-lg font-bold">
              🏡
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Household Settings
              </h2>
              <p className="text-xs text-slate-500">
                Home profile, photo & Mom PIN security
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* SECTION 1: HOUSE PHOTO & IDENTITY (Apple Inset Grouped Card) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
              Home Profile & Cover
            </span>

            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50">
              
              {/* Photo Area */}
              <div className="p-3">
                {housePhotoUrl ? (
                  <div className="relative h-44 w-full rounded-xl overflow-hidden bg-slate-900 group">
                    <img
                      src={housePhotoUrl}
                      alt="House Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end justify-between p-3">
                      <span className="text-xs font-bold text-white bg-black/50 px-2.5 py-1 rounded-lg backdrop-blur-md">
                        🏡 {familyName}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="min-h-[36px] px-3 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-xs font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-rose-600" />
                          <span>Change</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="min-h-[36px] w-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-transform active:scale-95 flex items-center justify-center cursor-pointer"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[140px] flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-rose-400 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-rose-50/20 text-center cursor-pointer transition-colors"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-rose-500 shadow-2xs mb-2">
                      <Camera className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Tap to upload house photo
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Syncs automatically to family devices & phones
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="house-photo-input"
                />

                {uploadError && (
                  <p className="text-xs font-semibold text-rose-600 mt-2">{uploadError}</p>
                )}
              </div>

              {/* Family Name Row */}
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 w-32 shrink-0">
                  Family Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Berenji Family"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="flex-1 text-xs font-bold p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Motto Row */}
              <div className="p-3.5 flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 w-32 shrink-0">
                  Family Motto
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clean spaces, happy smiles & teamwork! ✨"
                  value={houseAddressOrMotto}
                  onChange={(e) => setHouseAddressOrMotto(e.target.value)}
                  className="flex-1 text-xs font-medium p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: MOM / PARENT PIN SECURITY (Apple Inset Grouped) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
              Mom / Parent Mode Security
            </span>

            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-700/50">
              
              {/* Toggle Row */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      PIN Protection
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Require 4-digit PIN for Mom Mode & grading
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinEnabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setIsPinEnabled(enabled);
                      setPinProtectionEnabled(enabled, householdInfo.householdId);
                      soundFX.playPop();
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* PIN Config Row */}
              <div className="p-4 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs text-slate-700 dark:text-slate-300">
                    Parent PIN: <strong className="font-mono tracking-widest bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-md text-amber-900 dark:text-amber-200">••••</strong>
                  </div>

                  {!isEditingPin ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        setIsEditingPin(true);
                        setPinNotice(null);
                      }}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Change PIN</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <input
                        type="password"
                        maxLength={4}
                        pattern="[0-9]*"
                        placeholder="New 4-digit PIN"
                        value={customPinInput}
                        onChange={(e) => setCustomPinInput(e.target.value)}
                        className="w-32 text-center text-xs font-bold p-2 rounded-xl border border-amber-300 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-amber-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!/^\d{4}$/.test(customPinInput)) {
                            setPinNotice('PIN must be exactly 4 digits');
                            soundFX.playPop();
                            return;
                          }
                          if (setParentPin(customPinInput, householdInfo.householdId)) {
                            soundFX.playRewardCoin();
                            setPinNotice('PIN updated & synced live to all devices! ☁️');
                            setIsEditingPin(false);
                            setCustomPinInput('');
                          }
                        }}
                        className="min-h-[36px] px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingPin(false);
                          setCustomPinInput('');
                          setPinNotice(null);
                        }}
                        className="min-h-[36px] px-2.5 py-1.5 text-slate-500 text-xs hover:text-slate-800 dark:hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {pinNotice && (
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 animate-in fade-in flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{pinNotice}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: MAINTENANCE / DANGER ZONE */}
          {onResetDemo && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                Data Maintenance
              </span>

              <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Reset Demo Household
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Restore default demo chores and sample helpers
                    </p>
                  </div>

                  {!showResetConfirm ? (
                    <button
                      type="button"
                      id="admin-reset-demo-btn"
                      onClick={() => {
                        soundFX.playPop();
                        setShowResetConfirm(true);
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                    >
                      Reset Data
                    </button>
                  ) : null}
                </div>

                {showResetConfirm && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2 animate-in fade-in">
                    <p className="text-xs text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Are you sure? This restores sample data on this device.</span>
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          soundFX.playPop();
                          onResetDemo();
                          setShowResetConfirm(false);
                          onClose();
                        }}
                        className="min-h-[36px] px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        Yes, Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="min-h-[36px] px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 sticky bottom-0 bg-slate-50 dark:bg-slate-900 py-3 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessingPhoto}
              className="min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4 text-white" />
              <span>Save & Sync Changes</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

