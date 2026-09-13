/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';
import { soundFX } from '../utils/audio';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';

interface MemberPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPin?: string) => void;
  expectedPin: string;
  memberName: string;
  currentTheme?: ThemePreset;
  mode?: 'verify' | 'setup';
}

export const MemberPinModal: React.FC<MemberPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expectedPin,
  memberName,
  currentTheme = 'rose',
  mode = 'verify',
}) => {
  const theme = THEMES[currentTheme] || THEMES.rose;
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [firstPin, setFirstPin] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg(null);
      setSetupStep(1);
      setFirstPin('');
    }
  }, [isOpen]);

  // Physical keyboard listener for digits
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin]);

  if (!isOpen) return null;

  const handleDigitPress = (digit: string) => {
    const targetLength = mode === 'setup' ? 4 : expectedPin.length;
    if (pin.length >= targetLength) return;

    soundFX.playPop();
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMsg(null);

    if (nextPin.length === targetLength) {
      setTimeout(() => {
        if (mode === 'setup') {
          if (setupStep === 1) {
            setFirstPin(nextPin);
            setPin('');
            setSetupStep(2);
            soundFX.playComplete();
          } else {
            if (nextPin === firstPin) {
              soundFX.playComplete();
              onSuccess(nextPin);
              onClose();
            } else {
              soundFX.playPop();
              setErrorMsg('PINs do not match. Try again.');
              setIsShaking(true);
              setTimeout(() => {
                setIsShaking(false);
                setPin('');
                setFirstPin('');
                setSetupStep(1);
              }, 1000);
            }
          }
        } else {
          if (nextPin === expectedPin) {
            soundFX.playComplete();
            onSuccess();
            onClose();
          } else {
            soundFX.playPop();
            setErrorMsg('Incorrect PIN. Please try again.');
            setIsShaking(true);
            setTimeout(() => {
              setIsShaking(false);
              setPin('');
            }, 600);
          }
        }
      }, 150);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      soundFX.playPop();
      setPin(pin.slice(0, -1));
      setErrorMsg(null);
    }
  };

  const handleClear = () => {
    soundFX.playPop();
    setPin('');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden ${
          isGlassTheme(currentTheme)
            ? 'apple-glass-card border-white/30 text-slate-900'
            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-800'
        } ${isShaking ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
      >
        {/* Header */}
        <div className={`p-4 flex items-center justify-between border-b ${isGlassTheme(currentTheme) ? 'border-white/20' : 'border-slate-100 dark:border-slate-800'}`}>
          <div className="flex items-center gap-2">
            <Lock className={`w-5 h-5 ${isGlassTheme(currentTheme) ? 'text-slate-700' : 'text-slate-600 dark:text-slate-400'}`} />
            <h2 className="font-bold">{mode === 'setup' ? `Set PIN for ${memberName}` : `Enter PIN for ${memberName}`}</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${isGlassTheme(currentTheme) ? 'hover:bg-white/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-center text-xs text-slate-500 mb-2">
            {mode === 'setup' 
              ? (setupStep === 1 ? 'Create a 4-digit PIN to secure this profile.' : 'Confirm your 4-digit PIN.')
              : 'Please enter your personal PIN to access your profile.'}
          </p>

          {/* PIN Dots Display */}
          <div className="flex justify-center gap-3 py-2">
            {Array.from({ length: mode === 'setup' ? 4 : expectedPin.length }).map((_, i) => (
              <div 
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  i < pin.length 
                    ? (isGlassTheme(currentTheme) ? 'bg-slate-800 scale-100 shadow-sm' : 'bg-slate-800 dark:bg-white scale-100 shadow-sm')
                    : (isGlassTheme(currentTheme) ? 'bg-white/40 scale-75' : 'bg-slate-200 dark:bg-slate-700 scale-75')
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center justify-center gap-1.5 text-rose-600 animate-in slide-in-from-top-2 fade-in">
              <AlertCircle className="w-3.5 h-3.5" />
              <p className="text-xs font-bold">{errorMsg}</p>
            </div>
          )}

          {/* On-Screen Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitPress(digit)}
                className={`h-12 rounded-2xl font-bold text-lg transition-transform active:scale-95 shadow-2xs cursor-pointer select-none ${isGlassTheme(currentTheme) ? 'bg-white/20 hover:bg-white/30 text-slate-900 dark:text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white'}`}
              >
                {digit}
              </button>
            ))}
            
            <button
              type="button"
              onClick={handleClear}
              className={`h-12 rounded-2xl font-semibold text-xs transition-colors cursor-pointer select-none flex items-center justify-center ${isGlassTheme(currentTheme) ? 'bg-white/10 hover:bg-white/20 text-slate-700' : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              className={`h-12 rounded-2xl font-bold text-lg transition-transform active:scale-95 shadow-2xs cursor-pointer select-none ${isGlassTheme(currentTheme) ? 'bg-white/20 hover:bg-white/30 text-slate-900 dark:text-white' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white'}`}
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className={`h-12 rounded-2xl font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer select-none ${isGlassTheme(currentTheme) ? 'bg-white/10 hover:bg-white/20 text-slate-700' : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
              title="Backspace"
            >
              ⌫
            </button>
          </div>
        </div>

        {mode === 'verify' && (
          <div className="text-center mt-6">
            <p className="text-[10px] text-slate-400">
              Forgot PIN? Ask Mom to reset it in Family Members.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};