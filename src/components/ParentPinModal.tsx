/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, KeyRound, X, Check, AlertCircle, ShieldAlert, ArrowLeft, ShieldCheck } from 'lucide-react';
import { verifyParentPin, setParentPin, setParentSessionUnlocked, getParentPin, isPinProtectionEnabled } from '../utils/parentLock';
import { getCurrentHouseholdId } from '../utils/firebaseSync';
import { soundFX } from '../utils/audio';
import { ThemePreset, THEMES } from '../utils/theme';

interface ParentPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionTitle?: string;
  actionDescription?: string;
  currentTheme?: ThemePreset;
}

export const ParentPinModal: React.FC<ParentPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = 'Mom / Parent Mode Access',
  actionDescription = 'Enter the 4-digit Parent PIN to access inspection scores, approvals, and house controls.',
  currentTheme = 'rose',
}) => {
  const theme = THEMES[currentTheme] || THEMES.rose;
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  
  // Pin Change flow states
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [changeStep, setChangeStep] = useState<'verify_old' | 'enter_new' | 'confirm_new'>('verify_old');
  const [changeSuccessMsg, setChangeSuccessMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg(null);
      setIsChangingPin(false);
      setChangeStep('verify_old');
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setChangeSuccessMsg(null);
    }
  }, [isOpen]);

  // Physical keyboard listener for digits
  useEffect(() => {
    if (!isOpen || isChangingPin) return;

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
  }, [isOpen, pin, isChangingPin]);

  if (!isOpen) return null;

  const handleDigitPress = (digit: string) => {
    if (pin.length >= 4) return;
    soundFX.playPop();
    const nextPin = pin + digit;
    setPin(nextPin);
    setErrorMsg(null);

    if (nextPin.length === 4) {
      // Auto-validate 4 digits
      setTimeout(() => {
        if (verifyParentPin(nextPin)) {
          soundFX.playComplete();
          setParentSessionUnlocked(true);
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
      }, 150);
    }
  };

  const handleBackspace = () => {
    soundFX.playPop();
    setPin(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    soundFX.playPop();
    setPin('');
    setErrorMsg(null);
  };

  // Change PIN handlers
  const handleVerifyCurrentForChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyParentPin(currentPinInput)) {
      soundFX.playComplete();
      setErrorMsg(null);
      setChangeStep('enter_new');
    } else {
      soundFX.playPop();
      setErrorMsg('Current PIN does not match.');
    }
  };

  const handleSetNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(newPinInput)) {
      setErrorMsg('PIN must be exactly 4 numeric digits.');
      return;
    }
    setErrorMsg(null);
    soundFX.playPop();
    setChangeStep('confirm_new');
  };

  const handleConfirmNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmPinInput !== newPinInput) {
      setErrorMsg('PIN confirmation does not match.');
      return;
    }

    const isCloud = Boolean(getCurrentHouseholdId());

    if (setParentPin(newPinInput)) {
      soundFX.playRewardCoin();
      setChangeSuccessMsg(isCloud ? 'Parent PIN updated & synced across all family devices! ☁️' : 'Parent PIN changed successfully!');
      setErrorMsg(null);
      setTimeout(() => {
        setIsChangingPin(false);
        setPin('');
      }, 1200);
    } else {
      setErrorMsg('Failed to update PIN.');
    }
  };

  const isCloud = Boolean(getCurrentHouseholdId());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        ref={containerRef}
        className={`bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Top Header */}
        <div className={`${theme.primaryBg} p-4 sm:p-5 ${theme.primaryText} flex items-center justify-between`}>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-lg shadow-xs">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight">
                {isChangingPin ? 'Change Parent PIN' : actionTitle}
              </h2>
              <p className="text-[11px] opacity-85">
                {isChangingPin ? (isCloud ? 'Cloud-synced across all family devices ☁️' : 'Set a custom 4-digit code') : 'Parent & Admin Security'}
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

        {!isChangingPin ? (
          /* Normal PIN Unlock View */
          <div className="p-5 sm:p-6 space-y-5 text-center">
            
            <div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {actionDescription}
              </p>
            </div>

            {/* 4 PIN Indicators */}
            <div className="flex items-center justify-center gap-3 py-1">
              {[0, 1, 2, 3].map((index) => {
                const filled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-150 ${
                      filled
                        ? `${theme.primaryBg} scale-110 shadow-xs`
                        : 'bg-slate-200 border border-slate-300'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error Message */}
            {errorMsg ? (
              <div className="text-xs font-bold text-rose-600 flex items-center justify-center gap-1.5 bg-rose-50 p-2 rounded-xl border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                Default PIN: <strong className="text-slate-600">1234</strong>
              </p>
            )}

            {/* On-Screen Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitPress(digit)}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 font-bold text-lg transition-transform active:scale-95 shadow-2xs cursor-pointer select-none"
                >
                  {digit}
                </button>
              ))}
              
              <button
                type="button"
                onClick={handleClear}
                className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-semibold text-xs transition-colors cursor-pointer select-none"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-900 font-bold text-lg transition-transform active:scale-95 shadow-2xs cursor-pointer select-none"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer select-none"
                title="Backspace"
              >
                ⌫
              </button>
            </div>

            {/* Bottom Change PIN Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  soundFX.playPop();
                  setIsChangingPin(true);
                  setErrorMsg(null);
                }}
                className="text-rose-600 hover:text-rose-700 font-bold hover:underline flex items-center gap-1 mx-auto"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Parent PIN</span>
              </button>
            </div>

          </div>
        ) : (
          /* Change PIN Wizard */
          <div className="p-5 sm:p-6 space-y-4">
            
            {changeSuccessMsg ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-800">{changeSuccessMsg}</p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to PIN prompt</span>
                </button>

                {changeStep === 'verify_old' && (
                  <form onSubmit={handleVerifyCurrentForChange} className="space-y-3">
                    <p className="text-xs text-slate-600">
                      Step 1: Enter your current 4-digit Parent PIN to verify:
                    </p>
                    <input
                      type="password"
                      maxLength={4}
                      pattern="[0-9]*"
                      autoFocus
                      required
                      placeholder="Current PIN (e.g. 1234)"
                      value={currentPinInput}
                      onChange={(e) => setCurrentPinInput(e.target.value)}
                      className="w-full text-center tracking-widest text-lg p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 font-bold"
                    />
                    {errorMsg && (
                      <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                    >
                      Verify Current PIN
                    </button>
                  </form>
                )}

                {changeStep === 'enter_new' && (
                  <form onSubmit={handleSetNewPin} className="space-y-3">
                    <p className="text-xs text-slate-600">
                      Step 2: Enter your <strong>new 4-digit Parent PIN</strong>:
                    </p>
                    <input
                      type="password"
                      maxLength={4}
                      pattern="[0-9]*"
                      autoFocus
                      required
                      placeholder="New 4-digit PIN"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value)}
                      className="w-full text-center tracking-widest text-lg p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 font-bold"
                    />
                    {errorMsg && (
                      <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                    >
                      Continue
                    </button>
                  </form>
                )}

                {changeStep === 'confirm_new' && (
                  <form onSubmit={handleConfirmNewPin} className="space-y-3">
                    <p className="text-xs text-slate-600">
                      Step 3: <strong>Confirm your new 4-digit PIN</strong>:
                    </p>
                    <input
                      type="password"
                      maxLength={4}
                      pattern="[0-9]*"
                      autoFocus
                      required
                      placeholder="Re-type new PIN"
                      value={confirmPinInput}
                      onChange={(e) => setConfirmPinInput(e.target.value)}
                      className="w-full text-center tracking-widest text-lg p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 font-bold"
                    />
                    {errorMsg && (
                      <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                    >
                      Save New PIN
                    </button>
                  </form>
                )}
              </>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
