import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  CheckCircle2, 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Award, 
  ListTodo, 
  Users, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Home, 
  ArrowRight,
  Lightbulb,
  Check,
  Undo2,
  RefreshCw
} from 'lucide-react';
import { 
  HouseholdMember, 
  Chore, 
  RewardItem, 
  HouseholdInfo, 
  BuddyChatMessage, 
  BuddyAction, 
  BuddyActionType 
} from '../types';
import { soundFX } from '../utils/audio';
import { ThemePreset, THEMES, isGlassTheme } from '../utils/theme';
import { ensureAuthenticatedHousehold, getHouseholdAuthHeaders } from '../utils/firebaseSync';

interface AISetupBuddyModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdInfo: HouseholdInfo;
  members: HouseholdMember[];
  chores: Chore[];
  rewards: RewardItem[];
  currentTheme: ThemePreset;
  onApplyActions: (actions: BuddyAction[]) => void;
  initialPrompt?: string;
}

const INITIAL_WELCOME_MESSAGE: BuddyChatMessage = {
  id: 'msg_welcome',
  role: 'model',
  text: `👋 **Hi! I'm Buddy, your AI Family Setup & Management Companion!**

I can help you build your complete family routine from scratch, or edit and optimize any part of your household:
* 👨‍👩‍👧‍👦 **Family Members** — Add parents, teens, and kids with custom ages, avatars, and star goals.
* 🧹 **Smart Chores & Quality Checklists** — Generate age-tailored tasks with clear inspection steps for Mom & Dad.
* 🎁 **Motivating Rewards** — Set up screen time, allowances, treats, and fun weekend activities.
* ✏️ **Edit & Rebalance** — Reassign chores, update points, change household mottos, or delete tasks.

What would you like to set up or customize today?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  suggestedFollowUps: [
    "Set up our whole family with kids and chores",
    "Suggest chores for a 7-year-old & 11-year-old",
    "Create 5 motivating rewards for screen time & treats",
    "Review and balance our current chores"
  ]
};

export const AISetupBuddyModal: React.FC<AISetupBuddyModalProps> = ({
  isOpen,
  onClose,
  householdInfo,
  members,
  chores,
  rewards,
  currentTheme,
  onApplyActions,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<BuddyChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('family_chore_ai_buddy_chat_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [INITIAL_WELCOME_MESSAGE];
  });

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoApply, setAutoApply] = useState<boolean>(true);
  const [showSnapshot, setShowSnapshot] = useState<boolean>(false);
  const [lastAppliedBatch, setLastAppliedBatch] = useState<BuddyAction[] | null>(null);
  const [expandedActionIds, setExpandedActionIds] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const theme = THEMES[currentTheme] || THEMES.rose;

  // Save conversation in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('family_chore_ai_buddy_chat_v2', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Handle initial prompt if provided when opened
  useEffect(() => {
    if (isOpen && initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt.trim());
    }
  }, [isOpen, initialPrompt]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    soundFX.playPop();
    setInputPrompt('');

    const userMessage: BuddyChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      await ensureAuthenticatedHousehold();
      // Send conversation to backend Gemini setup-buddy endpoint
      const response = await fetch('/api/ai/setup-buddy', {
        method: 'POST',
        headers: getHouseholdAuthHeaders(),
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, text: m.text })),
          currentHousehold: {
            householdInfo,
            members,
            chores,
            rewards,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const rawActions: any[] = Array.isArray(data.actions) ? data.actions : [];

      const parsedActions: BuddyAction[] = rawActions.map((act, index) => ({
        id: `act_${Date.now()}_${index}`,
        type: act.type as BuddyActionType,
        summary: act.summary || `${act.type}: ${JSON.stringify(act.data).slice(0, 40)}`,
        data: act.data,
        applied: autoApply,
      }));

      const modelMessage: BuddyChatMessage = {
        id: `msg_model_${Date.now()}`,
        role: 'model',
        text: data.reply || "I've reviewed your request and made the requested changes!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: parsedActions.length > 0 ? parsedActions : undefined,
        suggestedFollowUps: Array.isArray(data.suggestedFollowUps) ? data.suggestedFollowUps : undefined,
      };

      setMessages(prev => [...prev, modelMessage]);

      // If auto-apply is enabled and actions exist, immediately apply to household!
      if (autoApply && parsedActions.length > 0) {
        onApplyActions(parsedActions);
        setLastAppliedBatch(parsedActions);
        soundFX.playRewardCoin();
      }
    } catch (err: any) {
      console.warn('AI Setup Buddy API notice:', err);
      const fallbackMsg: BuddyChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'model',
        text: `I had trouble connecting to the AI service for a moment. You can still tell me your family details, or click one of the quick suggestions below!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          "Add kids with ages",
          "Create morning & evening chores",
          "Set up allowance rewards",
        ],
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySingleAction = (messageId: string, actionId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg || !msg.actions) return;
    const action = msg.actions.find(a => a.id === actionId);
    if (!action || action.applied) return;

    soundFX.playPop();
    onApplyActions([action]);

    // Mark as applied
    setMessages(prev =>
      prev.map(m => {
        if (m.id !== messageId || !m.actions) return m;
        return {
          ...m,
          actions: m.actions.map(a => a.id === actionId ? { ...a, applied: true } : a),
        };
      })
    );
  };

  const handleApplyAllMessageActions = (messageId: string) => {
    const msg = messages.find(m => m.id === messageId);
    if (!msg || !msg.actions) return;
    const unapplied = msg.actions.filter(a => !a.applied);
    if (unapplied.length === 0) return;

    soundFX.playRewardCoin();
    onApplyActions(unapplied);
    setLastAppliedBatch(unapplied);

    setMessages(prev =>
      prev.map(m => {
        if (m.id !== messageId || !m.actions) return m;
        return {
          ...m,
          actions: m.actions.map(a => ({ ...a, applied: true })),
        };
      })
    );
  };

  const handleResetChat = () => {
    soundFX.playPop();
    if (window.confirm('Start a fresh conversation with Buddy? Your household items will remain intact.')) {
      setMessages([INITIAL_WELCOME_MESSAGE]);
      localStorage.removeItem('family_chore_ai_buddy_chat_v2');
    }
  };

  const toggleActionDetails = (id: string) => {
    setExpandedActionIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Simple Markdown text renderer with support for bold, bullet lists, numbered lists, and code
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Bullet points
          if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            const content = line.trim().substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5">
                <span className="text-sky-500 font-bold">•</span>
                <div>{parseInlineFormatting(content)}</div>
              </div>
            );
          }

          // Numbered lists
          const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5">
                <span className="text-amber-500 font-bold text-xs shrink-0 mt-0.5">{numMatch[1]}.</span>
                <div>{parseInlineFormatting(numMatch[2])}</div>
              </div>
            );
          }

          // Regular paragraph
          return <p key={idx}>{parseInlineFormatting(line)}</p>;
        })}
      </div>
    );
  };

  // Helper for **bold** and `code`
  const parseInlineFormatting = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1 py-0.5 text-[11px] rounded bg-slate-200 dark:bg-slate-800 text-pink-600 dark:text-pink-400 font-mono">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const getActionBadgeColor = (type: BuddyActionType) => {
    if (type.startsWith('ADD_')) return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
    if (type.startsWith('UPDATE_')) return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
    if (type.startsWith('DELETE_')) return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
    return 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800';
  };

  const getActionIcon = (type: BuddyActionType) => {
    if (type.includes('MEMBER')) return <Users className="w-3.5 h-3.5" />;
    if (type.includes('CHORE')) return <ListTodo className="w-3.5 h-3.5" />;
    if (type.includes('REWARD')) return <Award className="w-3.5 h-3.5" />;
    return <Home className="w-3.5 h-3.5" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`relative w-full max-w-4xl h-[92vh] sm:h-[86vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden ${
          isGlassTheme(currentTheme)
            ? 'apple-glass-card border-white/30 text-slate-900 dark:text-white shadow-2xl'
            : theme.isDark
            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-2xl'
            : 'bg-white border-slate-200 text-slate-800 shadow-2xl'
        }`}
      >
        {/* Modal Top Header Bar */}
        <div className={`px-4 sm:px-6 py-3.5 flex items-center justify-between border-b shrink-0 ${
          isGlassTheme(currentTheme)
            ? 'bg-white/10 border-white/20'
            : theme.isDark
            ? 'bg-slate-800/80 border-slate-700'
            : 'bg-slate-50/90 border-slate-200'
        }`}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-indigo-500 via-sky-500 to-rose-400 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5 animate-spin-slow" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight truncate">
                  AI Household Setup Buddy
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500 text-white shadow-2xs">
                  Gemini
                </span>
              </div>
              <p className={`text-[11px] truncate ${isGlassTheme(currentTheme) ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                Talk with Buddy to create, edit, or rebalance members, chores & rewards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Snapshot Drawer Toggle */}
            <button
              onClick={() => setShowSnapshot(!showSnapshot)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                showSnapshot
                  ? 'bg-sky-500 text-white border-sky-600 shadow-xs'
                  : 'bg-white/60 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-white'
              }`}
              title="Toggle Live Household Snapshot"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Household Snapshot</span>
              <span className="px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px]">
                {members.length}M · {chores.length}C · {rewards.length}R
              </span>
            </button>

            {/* Clear Chat Button */}
            <button
              onClick={handleResetChat}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${isGlassTheme(currentTheme) ? 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/20' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}
              title="Clear conversation history and start fresh"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${isGlassTheme(currentTheme) ? 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/20' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'}`}
              title="Close Buddy"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body: Chat Stream & Optional Snapshot Panel */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Main Chat Stream Container */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            
            {/* Messages Scroll Area */}
            <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-4 scroll-smooth">
              {messages.map((msg) => {
                const isModel = msg.role === 'model';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 sm:gap-3.5 ${
                      isModel ? 'justify-start' : 'justify-end'
                    }`}
                  >
                    {/* Model Avatar */}
                    {isModel && (
                      <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm shadow-xs border transition-all ${
                        isModel
                          ? isGlassTheme(currentTheme)
                            ? 'bg-white/95 border-white/60 text-slate-900 backdrop-blur-xl shadow-md font-medium'
                            : theme.isDark
                            ? 'bg-slate-800/90 border-slate-700 text-slate-100'
                            : 'bg-white border-slate-200 text-slate-800'
                          : `${theme.primaryBg} text-white border-transparent ml-auto`
                      }`}
                    >
                      {/* Message Content */}
                      <div>{renderFormattedText(msg.text)}</div>

                      {/* Attached Structured Actions (if Buddy proposed/executed changes) */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span>Proposed Household Changes ({msg.actions.length})</span>
                            </span>

                            {!msg.actions.every(a => a.applied) && (
                              <button
                                onClick={() => handleApplyAllMessageActions(msg.id)}
                                className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs cursor-pointer flex items-center gap-1 transition-transform active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Apply All</span>
                              </button>
                            )}
                          </div>

                          {/* Action Items List */}
                          <div className="space-y-1.5">
                            {msg.actions.map((act) => {
                              const isExpanded = expandedActionIds[act.id];
                              return (
                                <div
                                  key={act.id}
                                  className={`p-2.5 rounded-xl border transition-all ${
                                    act.applied
                                      ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/50'
                                      : 'bg-slate-50/80 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border flex items-center gap-1 shrink-0 ${getActionBadgeColor(act.type)}`}>
                                        {getActionIcon(act.type)}
                                        <span>{act.type.replace('_', ' ')}</span>
                                      </span>
                                      <span className="font-bold text-xs truncate text-slate-800 dark:text-slate-200">
                                        {act.summary}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button
                                        onClick={() => toggleActionDetails(act.id)}
                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        title="View payload data"
                                      >
                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                      </button>

                                      {act.applied ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                                          <CheckCircle2 className="w-3 h-3" />
                                          <span>Applied</span>
                                        </span>
                                      ) : (
                                        <button
                                          onClick={() => handleApplySingleAction(msg.id, act.id)}
                                          className="px-2 py-0.5 rounded-md text-[11px] font-black bg-sky-600 hover:bg-sky-500 text-white cursor-pointer active:scale-95"
                                        >
                                          Apply
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Expandable JSON details */}
                                  {isExpanded && (
                                    <pre className="mt-2 p-2 rounded-lg bg-slate-900 text-slate-200 text-[10px] font-mono overflow-x-auto max-h-32">
                                      {JSON.stringify(act.data, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Suggested Follow-up Quick Chips */}
                      {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                            <Lightbulb className="w-3 h-3 text-amber-500" />
                            Next:
                          </span>
                          {msg.suggestedFollowUps.map((chip, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => handleSendMessage(chip)}
                              className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 transition-all cursor-pointer active:scale-95 text-left"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className={`mt-1.5 text-[10px] text-right ${isModel ? 'text-slate-400' : 'text-white/75'}`}>
                        {msg.timestamp}
                      </div>
                    </div>

                    {/* User Avatar */}
                    {!isModel && (
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 shadow-xs mt-1">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loading Thinking Indicator */}
              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shrink-0 animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-2">
                    <div className="flex space-x-1">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      Buddy is thinking and drafting household items...
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Controls & Input Box */}
            <div className={`p-3 sm:p-4 border-t ${
              isGlassTheme(currentTheme)
                ? 'bg-white/20 border-white/20'
                : theme.isDark
                ? 'bg-slate-800/80 border-slate-700'
                : 'bg-slate-50 border-slate-200'
            }`}>
              
              {/* Quick Settings & Auto-Apply Bar */}
              <div className={`flex items-center justify-between mb-2 px-1 text-xs ${isGlassTheme(currentTheme) ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                  <input
                    type="checkbox"
                    checked={autoApply}
                    onChange={(e) => setAutoApply(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <span>Auto-apply Buddy changes to household</span>
                </label>

                {lastAppliedBatch && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Applied {lastAppliedBatch.length} change(s)</span>
                  </span>
                )}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder="Tell Buddy what you want to set up, add, edit, or change..."
                    disabled={isLoading}
                    className={`w-full pl-4 pr-10 py-3 rounded-2xl border text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all ${
                      isGlassTheme(currentTheme)
                        ? 'bg-white/80 border-white/60 text-slate-900 placeholder:text-slate-600 font-medium'
                        : theme.isDark
                        ? 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!inputPrompt.trim() || isLoading}
                  className={`px-4 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    isGlassTheme(currentTheme)
                      ? 'apple-glass-button-primary'
                      : `${theme.primaryBg} ${theme.primaryHover}`
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </div>

          {/* Collapsible Live Household Snapshot Panel */}
          {showSnapshot && (
            <div className={`w-72 sm:w-80 border-l flex flex-col overflow-hidden shrink-0 ${
              isGlassTheme(currentTheme)
                ? 'bg-white/30 border-white/20'
                : theme.isDark
                ? 'bg-slate-800/60 border-slate-700'
                : 'bg-slate-100/70 border-slate-200'
            }`}>
              <div className="p-3 border-b flex items-center justify-between font-extrabold text-xs">
                <span className="flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-sky-500" />
                  <span>Live Household Snapshot</span>
                </span>
                <span className="text-[10px] text-slate-400">Syncs live</span>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
                {/* Family info */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <div className="font-extrabold text-slate-900 dark:text-white truncate">
                    {householdInfo.familyName || 'Family Home'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {householdInfo.houseAddressOrMotto || 'No motto configured'}
                  </div>
                </div>

                {/* Members list */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center justify-between">
                    <span>Members ({members.length})</span>
                  </div>
                  <div className="space-y-1">
                    {members.map(m => (
                      <div key={m.id} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{m.avatarEmoji || '👤'}</span>
                          <div className="min-w-0">
                            <div className="font-bold truncate text-slate-800 dark:text-slate-100">{m.name}</div>
                            <div className="text-[10px] text-slate-400">{m.role} {m.age ? `· Age ${m.age}` : ''}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-amber-500">{m.currentPoints} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chores list summary */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center justify-between">
                    <span>Chores ({chores.length})</span>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {chores.map(c => {
                      const assignee = members.find(m => m.id === c.assignedMemberId);
                      return (
                        <div key={c.id} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                          <span className="font-medium truncate max-w-[140px]">{c.title}</span>
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 shrink-0">
                            {c.defaultPoints}p {assignee ? `· ${assignee.name.split(' ')[0]}` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rewards list summary */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center justify-between">
                    <span>Rewards ({rewards.length})</span>
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {rewards.map(r => (
                      <div key={r.id} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                        <span className="truncate max-w-[150px]">{r.icon} {r.title}</span>
                        <span className="text-[10px] font-bold text-emerald-600 shrink-0">{r.pointCost}p</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
