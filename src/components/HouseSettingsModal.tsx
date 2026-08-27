import React, { useState, useRef } from 'react';
import { X, Home, Camera, Upload, Trash2, Check, Sparkles, Image as ImageIcon, Lock, KeyRound, ShieldCheck, RotateCcw, AlertTriangle } from 'lucide-react';
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
  onOpenPinChange,
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
      // Allow higher resolution for house facade / landscape photo
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        id="house-settings-modal"
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shadow-xs">
              🏡
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                Household & Home Profile
              </h2>
              <p className="text-xs text-rose-100">
                Upload house photo, customize family name & motto
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* House Picture Banner Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              House Photo / Home Facade
            </label>

            <div className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden group">
              {housePhotoUrl ? (
                <div className="relative h-44 sm:h-52 w-full bg-slate-900">
                  <img
                    src={housePhotoUrl}
                    alt="House Preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end justify-between p-3.5">
                    <span className="text-xs font-bold text-white bg-slate-900/70 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                      🏡 {familyName}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-xs font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Change</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-transform active:scale-95"
                        title="Remove house photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-40 flex flex-col items-center justify-center p-5 text-center cursor-pointer hover:bg-slate-100/70 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-2xs mb-2 group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6 text-rose-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Click or tap to upload house photo
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Snap a picture from your phone camera or select from album
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
            </div>

            {uploadError && (
              <p className="text-xs font-semibold text-rose-600">{uploadError}</p>
            )}
          </div>

          {/* Family / Household Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Family / House Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. The Berenji Family"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 font-bold text-slate-900"
            />
          </div>

          {/* House Motto or Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Family Motto / Goal / Description
            </label>
            <input
              type="text"
              placeholder="e.g. Clean spaces, happy smiles & teamwork! ✨"
              value={houseAddressOrMotto}
              onChange={(e) => setHouseAddressOrMotto(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 font-medium text-slate-800"
            />
          </div>

          {/* Quick House Suggestions */}
          <div className="pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Quick Motto Ideas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Teamwork makes our dream work! 🌟',
                'Clean house, clear minds, happy hearts ❤️',
                'Every helper earns stars and smiles 🚀',
                'Work hard, play hard, help Mom & Dad! 🏆',
              ].map((motto) => (
                <button
                  key={motto}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setHouseAddressOrMotto(motto);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {motto}
                </button>
              ))}
            </div>
          </div>

          {/* Parent Mode Security & PIN Controls */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Mom / Admin PIN Security
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[11px] font-semibold text-amber-900">
                  {isPinEnabled ? 'PIN Protection Active' : 'Disabled'}
                </span>
                <input
                  type="checkbox"
                  checked={isPinEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setIsPinEnabled(enabled);
                    setPinProtectionEnabled(enabled);
                    soundFX.playPop();
                  }}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>

            <p className="text-xs text-amber-900/80 leading-relaxed">
              When PIN protection is enabled, kids cannot switch into Mom Mode to grade themselves, inspect tasks, edit points, or change family rules without entering your 4-digit PIN.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-200/60">
              <div className="text-xs text-amber-950">
                Current PIN: <strong className="tracking-widest font-mono">••••</strong> <span className="text-amber-800 text-[11px]">(Default is 1234)</span>
              </div>

              {!isEditingPin ? (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setIsEditingPin(true);
                    setPinNotice(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update PIN</span>
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
                    className="w-32 text-center text-xs p-1.5 rounded-lg border border-amber-300 bg-white font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!/^\d{4}$/.test(customPinInput)) {
                        setPinNotice('PIN must be 4 digits');
                        return;
                      }
                      if (setParentPin(customPinInput)) {
                        soundFX.playRewardCoin();
                        setPinNotice('PIN updated!');
                        setIsEditingPin(false);
                        setCustomPinInput('');
                      }
                    }}
                    className="px-2.5 py-1.5 bg-amber-800 text-white rounded-lg text-xs font-bold hover:bg-amber-900 transition-colors"
                  >
                    Save PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPin(false);
                      setCustomPinInput('');
                      setPinNotice(null);
                    }}
                    className="px-2 py-1.5 text-slate-500 text-xs hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {pinNotice && (
              <p className="text-xs font-semibold text-emerald-800">{pinNotice}</p>
            )}
          </div>

          {/* Admin Maintenance / Danger Zone: Reset Data */}
          {onResetDemo && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Admin Data Management
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Restore sample demo chores, family helper profiles, and default household motto.
              </p>

              {!showResetConfirm ? (
                <button
                  type="button"
                  id="admin-reset-demo-btn"
                  onClick={() => {
                    soundFX.playPop();
                    setShowResetConfirm(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All to Sample Demo Data</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Are you sure? This resets all chores, members & points back to default demo.</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playPop();
                        onResetDemo();
                        setShowResetConfirm(false);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      Yes, Reset All Data
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessingPhoto}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Save Household Info</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
