import React, { useState, useEffect, useRef } from 'react';
import { X, User, Camera, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { HouseholdMember, MemberRole } from '../types';
import { calculateAge, estimateBirthDateFromAge } from '../utils/age';
import { processImageFile } from '../utils/imageUpload';
import { Avatar } from './Avatar';
import { soundFX } from '../utils/audio';
import { ThemePreset, THEMES } from '../utils/theme';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberToEdit: HouseholdMember | null;
  currentTheme?: ThemePreset;
  onSaveMember: (
    memberData: Omit<HouseholdMember, 'id' | 'currentPoints' | 'lifetimePoints' | 'starsCount' | 'streakDays'> & { id?: string }
  ) => void;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  memberToEdit,
  currentTheme = 'rose',
  onSaveMember,
}) => {
  if (!isOpen) return null;

  const theme = THEMES[currentTheme] || THEMES.rose;

  const [name, setName] = useState('');
  const [role, setRole] = useState<MemberRole>('child');
  const [birthDate, setBirthDate] = useState<string>('');
  const [age, setAge] = useState<number | undefined>(undefined);
  const [avatarEmoji, setAvatarEmoji] = useState('👦');
  const [avatarPhotoUrl, setAvatarPhotoUrl] = useState<string | undefined>(undefined);
  const [targetWeeklyPoints, setTargetWeeklyPoints] = useState<number>(100);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const emojiPresets = ['👨‍🔧', '👩‍💼', '🧑‍🎓', '👧', '🧒', '👶', '👦', '🦸‍♀️', '🦸‍♂️', '⭐', '🚀', '🎨', '🦁', '🐱', '🐶', '⚽'];

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name);
      setRole(memberToEdit.role);
      const bDate = memberToEdit.birthDate || (memberToEdit.age ? estimateBirthDateFromAge(memberToEdit.age) : '');
      setBirthDate(bDate);
      setAge(bDate ? calculateAge(bDate) : memberToEdit.age);
      setAvatarEmoji(memberToEdit.avatarEmoji || '👦');
      setAvatarPhotoUrl(memberToEdit.avatarPhotoUrl);
      setTargetWeeklyPoints(memberToEdit.targetWeeklyPoints || 100);
    } else {
      setName('');
      setRole('child');
      const defaultBirth = estimateBirthDateFromAge(8);
      setBirthDate(defaultBirth);
      setAge(8);
      setAvatarEmoji('🧒');
      setAvatarPhotoUrl(undefined);
      setTargetWeeklyPoints(80);
    }
    setUploadError(null);
  }, [memberToEdit]);

  const handleBirthDateChange = (val: string) => {
    setBirthDate(val);
    if (val) {
      const computed = calculateAge(val);
      setAge(computed);
    }
  };

  const handleAgeChange = (val: number | undefined) => {
    setAge(val);
    if (val !== undefined && val > 0) {
      setBirthDate(estimateBirthDateFromAge(val));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setUploadError(null);
    try {
      const result = await processImageFile(file, 500, 0.85);
      setAvatarPhotoUrl(result.dataUrl);
      soundFX.playPop();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process image file');
    } finally {
      setIsProcessingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setAvatarPhotoUrl(undefined);
    soundFX.playPop();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const computedAge = birthDate ? calculateAge(birthDate) : (age ? Number(age) : undefined);

    onSaveMember({
      id: memberToEdit?.id,
      name: name.trim(),
      role,
      birthDate: birthDate || undefined,
      age: computedAge,
      avatarColor: 'bg-rose-500 text-white',
      avatarEmoji,
      avatarPhotoUrl: avatarPhotoUrl || undefined,
      targetWeeklyPoints: Number(targetWeeklyPoints) || 100,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div 
        id="family-member-modal"
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200 max-h-[92vh] sm:max-h-[94vh] flex flex-col my-auto"
      >
        {/* iOS Drag Handle for Mobile */}
        <div className={`sm:hidden pt-2.5 pb-1 flex justify-center ${theme.primaryBg} shrink-0`}>
          <div className="w-10 h-1 rounded-full bg-white/40" />
        </div>

        {/* Header */}
        <div className={`${theme.primaryBg} p-4 sm:p-5 text-white flex items-center justify-between shadow-xs shrink-0`}>
          <div className="flex items-center space-x-3">
            <Avatar
              photoUrl={avatarPhotoUrl}
              emoji={avatarEmoji}
              name={name || 'Member'}
              size="md"
              className="ring-2 ring-white/30"
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {memberToEdit ? 'Edit Family Member' : 'Add Family Member'}
              </h2>
              <p className="text-xs text-white/80">
                Photo, avatar emoji, age & point goals
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-2xl text-white/80 hover:text-white hover:bg-white/20 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Profile Picture Upload Section */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Profile Picture / Photo
            </label>
            
            <div className="flex items-center gap-3.5">
              <Avatar
                photoUrl={avatarPhotoUrl}
                emoji={avatarEmoji}
                name={name || 'Preview'}
                size="xl"
                className="shadow-sm"
              />

              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="member-photo-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs transition-colors active:scale-95 cursor-pointer min-h-[36px]"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{avatarPhotoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>

                  {avatarPhotoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors active:scale-95 cursor-pointer min-h-[36px]"
                      title="Remove profile photo and use emoji avatar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden xs:inline">Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {avatarPhotoUrl 
                    ? '✓ Photo active. Tap change to select another picture.' 
                    : 'Upload a selfie or portrait from phone camera or gallery.'}
                </p>
                {uploadError && (
                  <p className="text-[11px] font-semibold text-rose-600">{uploadError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Avatar Emoji Selector (Used as fallback or companion) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Choose Avatar Emoji
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {emojiPresets.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    soundFX.playPop();
                    setAvatarEmoji(emoji);
                  }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-base sm:text-lg flex items-center justify-center transition-all cursor-pointer ${
                    avatarEmoji === emoji
                      ? `${theme.badgeBg} border-2 ${theme.badgeBorder} scale-105 shadow-xs`
                      : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Member Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lucas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full text-sm p-3 rounded-xl border border-slate-300 focus:ring-2 ${theme.accentRing} font-medium`}
            />
          </div>

          {/* Role, Birth Date & Age */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Family Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as MemberRole)}
                className={`w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 ${theme.accentRing}`}
              >
                <option value="child">Child</option>
                <option value="teen">Teen / Young Adult</option>
                <option value="parent">Parent / Mom / Dad</option>
                <option value="other">Other Helper</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Birth Date
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => handleBirthDateChange(e.target.value)}
                className={`w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 ${theme.accentRing}`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Age {age !== undefined && <span className="text-emerald-700 font-bold">({age}y)</span>}
              </label>
              <input
                type="number"
                min="1"
                max="99"
                placeholder="e.g. 7"
                value={age ?? ''}
                onChange={(e) => handleAgeChange(e.target.value ? Number(e.target.value) : undefined)}
                className={`w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 ${theme.accentRing}`}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic">
            🌱 Ages calculate dynamically from birth dates as calendar years progress.
          </p>

          {/* Weekly Target Points */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Weekly Target Points Goal
            </label>
            <input
              type="number"
              min="10"
              max="500"
              value={targetWeeklyPoints}
              onChange={(e) => setTargetWeeklyPoints(Number(e.target.value))}
              className={`w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-amber-900 focus:ring-2 ${theme.accentRing}`}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Target for earning full weekly allowance or goal rewards.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold ${theme.primaryBg} ${theme.primaryHover} ${theme.primaryText} shadow-xs transition-transform active:scale-[0.98] cursor-pointer min-h-[44px]`}
            >
              {memberToEdit ? 'Save Member' : 'Add Member'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
