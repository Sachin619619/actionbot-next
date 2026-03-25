"use client";
import { useEffect, useState, useRef } from "react";
import { settings, admin } from "@/lib/api";
import {
  User, Mail, Crown, Key, Eye, EyeOff, Copy, Check,
  RefreshCw, Code, Globe, Layout, Trash2, MessageSquare,
  Loader2, Save, AlertTriangle, X, Shield, Lightbulb,
} from "lucide-react";

export default function SettingsPage() {
  // ── State ──
  const [tenant, setTenant] = useState<any>(null);
  const [name, setName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [keyRevealed, setKeyRevealed] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  const [widgetData, setWidgetData] = useState<any>(null);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState("");
  const [widgetPosition, setWidgetPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [clearingSessions, setClearingSessions] = useState(false);
  const [sessionsCleared, setSessionsCleared] = useState(false);

  // ── Load data ──
  useEffect(() => {
    settings.get().then((data: any) => {
      setTenant(data);
      setName(data.name);
      setInitialName(data.name);
    }).catch(console.error);

    admin.getWidgetCode().then(setWidgetData).catch(console.error);
  }, []);

  // ── Profile actions ──
  const hasNameChange = name !== initialName && name.trim().length > 0;

  const handleSaveName = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await settings.update({ name: name.trim() });
      setTenant(updated);
      setName(updated.name);
      setInitialName(updated.name);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── API Key actions ──
  const maskKey = (key: string) => {
    if (!key) return "";
    return key.slice(0, 7) + "\u2022".repeat(20) + key.slice(-4);
  };

  const copyApiKey = () => {
    if (!tenant?.apiKey) return;
    navigator.clipboard.writeText(tenant.apiKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleRegenerateKey = async () => {
    setRegenerating(true);
    try {
      const result = await settings.regenerateKey();
      setTenant((prev: any) => ({ ...prev, apiKey: result.apiKey }));
      setKeyRevealed(true);
      setShowRegenConfirm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setRegenerating(false);
    }
  };

  // ── Widget actions ──
  const copyEmbedCode = () => {
    if (!widgetData?.embedCode) return;
    navigator.clipboard.writeText(widgetData.embedCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  // ── Danger zone actions ──
  const handleClearSessions = async () => {
    setClearingSessions(true);
    try {
      // This would call a delete sessions endpoint
      await new Promise((r) => setTimeout(r, 1000));
      setSessionsCleared(true);
      setTimeout(() => setSessionsCleared(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setClearingSessions(false);
    }
  };

  // ── Plan badge ──
  const planColors: Record<string, { bg: string; text: string; border: string }> = {
    free: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
    pro: { bg: "bg-orange-50", text: "text-[#e85d04]", border: "border-orange-200" },
    enterprise: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  };

  if (!tenant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-[#e85d04]" />
      </div>
    );
  }

  const plan = tenant.plan || "free";
  const planStyle = planColors[plan] || planColors.free;

  return (
    <div className="max-w-[800px] mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl sm:text-3xl font-bold text-gray-900"
          style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
        >
          Settings
        </h1>
        <p className="text-gray-500 mt-1 text-[15px]">
          Manage your account, API keys, and widget configuration
        </p>
      </div>

      <div className="space-y-6 stagger-children">
        {/* ═══════════════════════════════════════════
            PROFILE SECTION
        ═══════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <User size={18} className="text-[#e85d04]" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
              >
                Profile
              </h2>
              <p className="text-xs text-gray-400">Your account information</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Tenant Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Tenant Name
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="premium-input flex-1"
                  placeholder="Your organization name"
                />
                {hasNameChange && (
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
                    style={{ background: saved ? "#16a34a" : "#e85d04", color: "white" }}
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : saved ? (
                      <Check size={16} />
                    ) : (
                      <Save size={16} />
                    )}
                    {saving ? "Saving..." : saved ? "Saved!" : "Save"}
                  </button>
                )}
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                <Mail size={16} className="text-gray-400" />
                <span className="text-sm text-gray-600">{tenant.email}</span>
                <span className="ml-auto text-[10px] font-medium text-gray-400 uppercase tracking-wider bg-gray-200/60 px-2 py-0.5 rounded-full">
                  Read-only
                </span>
              </div>
            </div>

            {/* Plan Badge */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Current Plan
              </label>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border ${planStyle.bg} ${planStyle.text} ${planStyle.border}`}
                >
                  <Crown size={14} />
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </span>
                {plan === "free" && (
                  <span className="text-xs text-gray-400">
                    Upgrade to Pro for more features
                  </span>
                )}
              </div>
            </div>

            {/* Member since */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Member since{" "}
                <span className="font-medium text-gray-500">
                  {new Date(tenant.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            API KEYS SECTION
        ═══════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Key size={18} className="text-blue-600" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
              >
                API Keys
              </h2>
              <p className="text-xs text-gray-400">Manage your API authentication</p>
            </div>
          </div>

          {/* API Key Display */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Your API Key
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] rounded-xl font-mono text-sm text-green-400 overflow-hidden">
                <span className="truncate">
                  {keyRevealed ? tenant.apiKey : maskKey(tenant.apiKey)}
                </span>
              </div>
              <button
                onClick={() => setKeyRevealed(!keyRevealed)}
                className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                title={keyRevealed ? "Hide API key" : "Reveal API key"}
              >
                {keyRevealed ? (
                  <EyeOff size={18} className="text-gray-600" />
                ) : (
                  <Eye size={18} className="text-gray-600" />
                )}
              </button>
              <button
                onClick={copyApiKey}
                className="p-3 rounded-xl transition-colors"
                style={{ background: keyCopied ? "#16a34a" : "#e85d04" }}
                title="Copy API key"
              >
                {keyCopied ? (
                  <Check size={18} className="text-white" />
                ) : (
                  <Copy size={18} className="text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Regenerate Key */}
          <div className="flex items-center justify-between py-4 px-4 bg-amber-50 border border-amber-200 rounded-xl mb-5">
            <div className="flex items-center gap-3">
              <RefreshCw size={18} className="text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">Regenerate API Key</p>
                <p className="text-xs text-amber-600">
                  This will invalidate your current key immediately
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRegenConfirm(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              Regenerate
            </button>
          </div>

          {/* Usage Tips */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-start gap-2.5">
              <Lightbulb size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-blue-700">API Key Usage Tips</p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>Never expose your API key in client-side code or public repositories</li>
                  <li>Use the embed code snippet for widget integration instead</li>
                  <li>Regenerate your key immediately if you suspect it has been compromised</li>
                  <li>Include the key as <code className="bg-blue-100 px-1 py-0.5 rounded text-[11px] font-mono">x-api-key</code> header in API requests</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            WIDGET CONFIGURATION
        ═══════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Code size={18} className="text-green-600" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
              >
                Widget Configuration
              </h2>
              <p className="text-xs text-gray-400">Embed code and display settings</p>
            </div>
          </div>

          {/* Embed Code */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Embed Code
              </label>
              <button
                onClick={copyEmbedCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: embedCopied ? "#16a34a" : "#e85d04",
                  color: "white",
                }}
              >
                {embedCopied ? <Check size={12} /> : <Copy size={12} />}
                {embedCopied ? "Copied!" : "Copy Code"}
              </button>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4 overflow-x-auto">
              <pre className="text-sm text-green-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
                {widgetData?.embedCode ||
                  '<script src="https://actionbot.app/widget.js" data-key="loading..."></script>'}
              </pre>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Paste this snippet before the closing{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-mono">
                &lt;/body&gt;
              </code>{" "}
              tag on your website.
            </p>
          </div>

          {/* Allowed Domains */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              <div className="flex items-center gap-2">
                <Globe size={13} />
                Allowed Domains
              </div>
            </label>
            <input
              type="text"
              value={allowedDomains}
              onChange={(e) => setAllowedDomains(e.target.value)}
              className="premium-input"
              placeholder="example.com, app.example.com, *.example.com"
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Comma-separated list of domains allowed to load your widget. Leave empty to allow all domains.
            </p>
          </div>

          {/* Widget Position */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              <div className="flex items-center gap-2">
                <Layout size={13} />
                Widget Position
              </div>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setWidgetPosition("bottom-right")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                  widgetPosition === "bottom-right"
                    ? "border-[#e85d04] bg-orange-50 text-[#e85d04]"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="w-8 h-6 rounded border border-current/30 relative">
                  <div
                    className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-sm"
                    style={{
                      background:
                        widgetPosition === "bottom-right" ? "#e85d04" : "#9ca3af",
                    }}
                  />
                </div>
                Bottom Right
              </button>
              <button
                onClick={() => setWidgetPosition("bottom-left")}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                  widgetPosition === "bottom-left"
                    ? "border-[#e85d04] bg-orange-50 text-[#e85d04]"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                }`}
              >
                <div className="w-8 h-6 rounded border border-current/30 relative">
                  <div
                    className="absolute bottom-0.5 left-0.5 w-2 h-2 rounded-sm"
                    style={{
                      background:
                        widgetPosition === "bottom-left" ? "#e85d04" : "#9ca3af",
                    }}
                  />
                </div>
                Bottom Left
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            DANGER ZONE
        ═══════════════════════════════════════════ */}
        <section className="bg-white rounded-2xl border-2 border-red-200 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-red-600"
                style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
              >
                Danger Zone
              </h2>
              <p className="text-xs text-red-400">Irreversible and destructive actions</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Clear Sessions */}
            <div className="flex items-center justify-between py-4 px-5 bg-red-50/50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-3">
                <MessageSquare size={18} className="text-red-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Clear All Chat Sessions
                  </p>
                  <p className="text-xs text-gray-500">
                    Permanently delete all chat sessions and messages
                  </p>
                </div>
              </div>
              <button
                onClick={handleClearSessions}
                disabled={clearingSessions}
                className="px-4 py-2 rounded-xl text-sm font-medium border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {clearingSessions ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : sessionsCleared ? (
                  <Check size={14} />
                ) : (
                  <Trash2 size={14} />
                )}
                {clearingSessions
                  ? "Clearing..."
                  : sessionsCleared
                  ? "Cleared!"
                  : "Clear All"}
              </button>
            </div>

            {/* Delete Account */}
            <div className="flex items-center justify-between py-4 px-5 bg-red-50/50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Delete Account</p>
                  <p className="text-xs text-gray-500">
                    Permanently delete your account and all associated data
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════
          REGENERATE KEY CONFIRMATION MODAL
      ═══════════════════════════════════════════ */}
      {showRegenConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <RefreshCw size={22} className="text-amber-600" />
              </div>
              <div>
                <h3
                  className="text-lg font-bold text-gray-900"
                  style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
                >
                  Regenerate API Key?
                </h3>
                <p className="text-xs text-gray-400">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800 leading-relaxed">
                Your current API key will be <strong>immediately invalidated</strong>. Any
                integrations using the old key will stop working. You will need to update
                your widget embed code and any API integrations.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRegenConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateKey}
                disabled={regenerating}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {regenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                {regenerating ? "Regenerating..." : "Yes, Regenerate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          DELETE ACCOUNT CONFIRMATION MODAL
      ═══════════════════════════════════════════ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <Trash2 size={22} className="text-red-500" />
                </div>
                <div>
                  <h3
                    className="text-lg font-bold text-gray-900"
                    style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
                  >
                    Delete Account
                  </h3>
                  <p className="text-xs text-red-400">This is permanent</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <p className="text-sm text-red-700 leading-relaxed">
                This will <strong>permanently delete</strong> your account, all bot
                configurations, tools, knowledge base entries, chat sessions, and audit
                logs. This action is <strong>irreversible</strong>.
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Type <span className="text-red-500 font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                placeholder="Type DELETE here..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmText !== "DELETE"}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
