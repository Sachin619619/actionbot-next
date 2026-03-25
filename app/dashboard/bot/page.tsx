"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { admin } from "@/lib/api";
import {
  Save, Loader2, Check, Sparkles, Plus, X, ChevronUp, ChevronDown,
  MessageSquare, Moon, Sun, AlertCircle,
} from "lucide-react";

const EMOJI_OPTIONS = [
  "\u{1F916}", "\u{1F4AC}", "\u{2728}", "\u{1F680}", "\u{1F9E0}",
  "\u{1F4A1}", "\u{1F31F}", "\u{1F525}", "\u{1F3AF}", "\u{26A1}",
  "\u{1F64B}", "\u{1F4BB}", "\u{1F393}", "\u{1F50D}", "\u{1F4DA}",
  "\u{1F308}", "\u{2764}\uFE0F", "\u{1F4E6}", "\u{1F3C6}", "\u{1F6E0}\uFE0F",
];

const PRESET_COLORS = [
  "#e85d04", "#2563eb", "#7c3aed", "#059669", "#dc2626",
  "#d97706", "#0891b2", "#be185d", "#4f46e5", "#1d4ed8",
];

interface BotConfigData {
  name: string;
  systemPrompt: string;
  personality: string;
  welcomeMessage: string;
  model: string;
  maxTokens: number;
  avatarUrl: string | null;
  quickReplies: string[];
  themeColor: string;
  darkMode: boolean;
}

export default function BotConfigPage() {
  const [config, setConfig] = useState<BotConfigData | null>(null);
  const [initialConfig, setInitialConfig] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    admin.getBotConfig().then((data: BotConfigData) => {
      const normalized = {
        ...data,
        quickReplies: data.quickReplies || [],
        themeColor: data.themeColor || "#e85d04",
        darkMode: data.darkMode || false,
        avatarUrl: data.avatarUrl || "\u{1F916}",
      };
      setConfig(normalized);
      setInitialConfig(JSON.stringify(normalized));
    }).catch(console.error);
  }, []);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasChanges = config ? JSON.stringify(config) !== initialConfig : false;

  const update = useCallback((partial: Partial<BotConfigData>) => {
    setConfig((prev) => prev ? { ...prev, ...partial } : prev);
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await admin.updateBotConfig({
        name: config.name,
        systemPrompt: config.systemPrompt,
        personality: config.personality,
        welcomeMessage: config.welcomeMessage,
        maxTokens: config.maxTokens,
        avatarUrl: config.avatarUrl,
        quickReplies: config.quickReplies,
        themeColor: config.themeColor,
        darkMode: config.darkMode,
      });
      const normalized = {
        ...updated,
        quickReplies: updated.quickReplies || [],
        themeColor: updated.themeColor || "#e85d04",
        darkMode: updated.darkMode || false,
        avatarUrl: updated.avatarUrl || "\u{1F916}",
      };
      setConfig(normalized);
      setInitialConfig(JSON.stringify(normalized));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addQuickReply = () => {
    if (!config || !newReply.trim() || config.quickReplies.length >= 5) return;
    update({ quickReplies: [...config.quickReplies, newReply.trim()] });
    setNewReply("");
  };

  const removeQuickReply = (index: number) => {
    if (!config) return;
    update({ quickReplies: config.quickReplies.filter((_, i) => i !== index) });
  };

  const moveQuickReply = (index: number, direction: "up" | "down") => {
    if (!config) return;
    const arr = [...config.quickReplies];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    update({ quickReplies: arr });
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-[#e85d04]" />
      </div>
    );
  }

  const promptLength = config.systemPrompt.length;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1B1C15]">Bot Configuration</h1>
        <p className="text-[rgba(0,0,0,0.5)] mt-1 text-[15px]">Design your AI assistant&apos;s identity, behavior, and appearance</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 xl:gap-8">
        {/* Left: Config Sections */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* Bot Identity */}
          <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#1B1C15]">Bot Identity</h2>
              <p className="text-sm text-gray-500 mt-0.5">Set your bot&apos;s name, avatar, and first impression</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              {/* Avatar Picker */}
              <div className="flex flex-col items-center gap-3" ref={emojiRef}>
                <div
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="relative w-20 h-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 hover:border-[#e85d04] flex items-center justify-center text-4xl cursor-pointer transition-all duration-200 hover:bg-orange-50"
                >
                  {config.avatarUrl || "\u{1F916}"}
                </div>
                <span className="text-xs text-gray-400 font-medium">Click to change</span>
                {showEmojiPicker && (
                  <div className="absolute z-20 mt-24 bg-white border border-gray-200 rounded-xl shadow-xl p-3 grid grid-cols-5 gap-2 w-[220px]">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => { update({ avatarUrl: emoji }); setShowEmojiPicker(false); }}
                        className={`text-2xl p-1.5 rounded-lg hover:bg-orange-50 transition-colors ${config.avatarUrl === emoji ? "bg-orange-100 ring-2 ring-[#e85d04]" : ""}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Name & Welcome */}
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Bot Name</label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder="e.g. ActionBot, HelpDesk AI"
                    className="premium-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Welcome Message</label>
                  <textarea
                    value={config.welcomeMessage}
                    onChange={(e) => update({ welcomeMessage: e.target.value })}
                    rows={3}
                    placeholder="Hi there! I'm your AI assistant. How can I help you today?"
                    className="premium-input"
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5">First message users see when opening the chat widget</p>
                </div>
              </div>
            </div>
          </section>

          {/* System Prompt */}
          <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#1B1C15]">System Prompt</h2>
                <p className="text-sm text-gray-500 mt-0.5">Define your AI&apos;s role, capabilities, and boundaries</p>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#e85d04] bg-orange-50 hover:bg-orange-100 transition-colors">
                <Sparkles size={14} />
                Generate with AI
              </button>
            </div>

            <textarea
              value={config.systemPrompt}
              onChange={(e) => update({ systemPrompt: e.target.value })}
              rows={10}
              placeholder={"You are a helpful customer support assistant for [Company].\n\nYour responsibilities:\n- Answer questions about our products and services\n- Help users troubleshoot common issues\n- Escalate complex issues to human agents\n\nTone: Professional yet friendly.\nAlways be concise and helpful."}
              className="premium-input font-mono text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] text-gray-400">
                Define your AI&apos;s role, personality, and constraints
              </p>
              <span className={`text-[11px] font-medium ${promptLength > 4000 ? "text-red-500" : promptLength > 3000 ? "text-amber-500" : "text-gray-400"}`}>
                {promptLength.toLocaleString()} characters
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-gray-100">
              <div>
                <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Personality</label>
                <select value={config.personality} onChange={(e) => update({ personality: e.target.value })} className="premium-input">
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
            </div>
          </section>

          {/* Quick Replies */}
          <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#1B1C15]">Quick Replies</h2>
              <p className="text-sm text-gray-500 mt-0.5">Suggested responses shown to users below the welcome message (max 5)</p>
            </div>

            <div className="space-y-2 mb-4">
              {config.quickReplies.map((reply, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <div className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                    {reply}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveQuickReply(i, "up")}
                      disabled={i === 0}
                      className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => moveQuickReply(i, "down")}
                      disabled={i === config.quickReplies.length - 1}
                      className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => removeQuickReply(i)}
                      className="p-1 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <X size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
              {config.quickReplies.length === 0 && (
                <div className="text-center py-6 text-sm text-gray-400">
                  No quick replies yet. Add some to help users get started.
                </div>
              )}
            </div>

            {config.quickReplies.length < 5 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addQuickReply(); }}
                  placeholder='e.g. "What can you do?" or "Pricing info"'
                  className="premium-input flex-1"
                />
                <button
                  onClick={addQuickReply}
                  disabled={!newReply.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            )}
          </section>

          {/* Appearance */}
          <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#1B1C15]">Appearance</h2>
              <p className="text-sm text-gray-500 mt-0.5">Customize the look of your chat widget</p>
            </div>

            <div className="space-y-6">
              {/* Theme Color */}
              <div>
                <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-3">Widget Theme Color</label>
                <div className="flex flex-wrap items-center gap-2.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => update({ themeColor: color })}
                      className="relative w-9 h-9 rounded-full transition-all duration-200 hover:scale-110"
                      style={{ backgroundColor: color, boxShadow: config.themeColor === color ? `0 0 0 3px white, 0 0 0 5px ${color}` : "none" }}
                    >
                      {config.themeColor === color && (
                        <Check size={16} className="absolute inset-0 m-auto text-white" />
                      )}
                    </button>
                  ))}
                  <div className="relative">
                    <input
                      type="color"
                      value={config.themeColor}
                      onChange={(e) => update({ themeColor: e.target.value })}
                      className="w-9 h-9 rounded-full cursor-pointer border-2 border-gray-200 bg-transparent appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
                    />
                  </div>
                </div>
                {/* Color preview bar */}
                <div className="mt-3 h-2 rounded-full" style={{ backgroundColor: config.themeColor }} />
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  {config.darkMode ? <Moon size={18} className="text-indigo-500" /> : <Sun size={18} className="text-amber-500" />}
                  <div>
                    <p className="text-sm font-medium text-gray-800">Dark Mode Default</p>
                    <p className="text-xs text-gray-400">Widget opens in dark mode for visitors</p>
                  </div>
                </div>
                <button
                  onClick={() => update({ darkMode: !config.darkMode })}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${config.darkMode ? "bg-[#e85d04]" : "bg-gray-300"}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${config.darkMode ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Live Preview */}
        <div className="xl:w-[360px] flex-shrink-0">
          <div className="xl:sticky xl:top-8">
            <h3 className="text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-3">Live Preview</h3>
            <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
              {/* Phone notch */}
              <div className="bg-gray-900 rounded-t-[2rem] flex justify-center pt-2 pb-1">
                <div className="w-24 h-5 bg-black rounded-full" />
              </div>
              {/* Screen */}
              <div className={`rounded-[1.5rem] overflow-hidden ${config.darkMode ? "bg-gray-800" : "bg-white"}`} style={{ minHeight: 480 }}>
                {/* Widget Header */}
                <div className="px-4 py-4 flex items-center gap-3" style={{ backgroundColor: config.themeColor }}>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                    {config.avatarUrl || "\u{1F916}"}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{config.name || "AI Assistant"}</p>
                    <p className="text-white/70 text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                      Online
                    </p>
                  </div>
                </div>

                {/* Chat Body */}
                <div className={`px-4 py-4 space-y-3 ${config.darkMode ? "bg-gray-800" : "bg-gray-50"}`} style={{ minHeight: 300 }}>
                  {/* Bot message */}
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ backgroundColor: config.themeColor + "20" }}>
                      {config.avatarUrl || "\u{1F916}"}
                    </div>
                    <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tl-md text-[13px] leading-relaxed ${config.darkMode ? "bg-gray-700 text-gray-200" : "bg-white text-gray-700 shadow-sm"}`}>
                      {config.welcomeMessage || "Hi! How can I help you today?"}
                    </div>
                  </div>

                  {/* Quick Replies */}
                  {config.quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 ml-9">
                      {config.quickReplies.map((reply, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors"
                          style={{
                            color: config.themeColor,
                            borderColor: config.themeColor + "40",
                            backgroundColor: config.themeColor + "08",
                          }}
                        >
                          {reply}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <div className={`px-3 py-3 border-t ${config.darkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${config.darkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                    <MessageSquare size={14} className={config.darkMode ? "text-gray-500" : "text-gray-400"} />
                    <span className={`text-xs ${config.darkMode ? "text-gray-500" : "text-gray-400"}`}>Type your message...</span>
                    <div className="ml-auto w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: config.themeColor }}>
                      <ChevronUp size={12} className="text-white rotate-90" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:left-[260px]">
        <div className={`transition-all duration-300 ${hasChanges ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}>
          <div className="bg-white/90 backdrop-blur-xl border-t border-gray-200 px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle size={16} />
                <span className="font-medium">You have unsaved changes</span>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-premium"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <Save size={18} />}
                {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
