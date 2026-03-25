"use client";
import { useEffect, useState } from "react";
import { channels } from "@/lib/api";
import {
  Share2, MessageCircle, Hash, Plus,
  Check, X, Copy, ExternalLink, Loader2,
  AlertCircle, ChevronRight, Zap,
} from "lucide-react";

interface Channel {
  id: string;
  type: string;
  name: string;
  config: any;
  isActive: boolean;
  webhookUrl?: string;
  createdAt: string;
}

const CHANNEL_TYPES = [
  {
    type: "telegram",
    label: "Telegram",
    icon: "✈️",
    color: "#0088cc",
    bg: "bg-blue-50",
    description: "Connect your Telegram bot to chat with users on Telegram",
    fields: [
      { key: "botToken", label: "Bot Token", placeholder: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11", type: "password", help: "Get this from @BotFather on Telegram" },
    ],
    setupGuide: [
      "Open Telegram and search for @BotFather",
      "Send /newbot and follow the steps to create a bot",
      "Copy the bot token and paste it here",
      "The webhook will be set up automatically!",
    ],
  },
  {
    type: "whatsapp",
    label: "WhatsApp",
    icon: "💬",
    color: "#25D366",
    bg: "bg-green-50",
    description: "Connect WhatsApp Business API for customer conversations",
    fields: [
      { key: "phoneNumberId", label: "Phone Number ID", placeholder: "1234567890", type: "text", help: "From Meta Business Suite" },
      { key: "accessToken", label: "Access Token", placeholder: "EAABsbCS...", type: "password", help: "Permanent token from Meta" },
      { key: "verifyToken", label: "Verify Token", placeholder: "my-custom-verify-token", type: "text", help: "Custom string for webhook verification" },
    ],
    setupGuide: [
      "Create a Meta Business account at business.facebook.com",
      "Set up a WhatsApp Business App in the Meta Developer portal",
      "Get your Phone Number ID and Access Token",
      "Add the webhook URL shown below in your Meta app settings",
    ],
  },
  {
    type: "slack",
    label: "Slack",
    icon: "#",
    color: "#4A154B",
    bg: "bg-purple-50",
    description: "Add your AI bot to Slack workspaces",
    fields: [
      { key: "botToken", label: "Bot Token", placeholder: "xoxb-...", type: "password", help: "From Slack App > OAuth & Permissions" },
      { key: "signingSecret", label: "Signing Secret", placeholder: "abc123...", type: "password", help: "From Slack App > Basic Information" },
    ],
    setupGuide: [
      "Go to api.slack.com/apps and create a new app",
      "Enable Event Subscriptions with the webhook URL below",
      "Subscribe to message.channels and message.im events",
      "Install the app to your workspace and copy the Bot Token",
    ],
  },
  {
    type: "discord",
    label: "Discord",
    icon: "🎮",
    color: "#5865F2",
    bg: "bg-indigo-50",
    description: "Add your AI bot to Discord servers (coming soon)",
    fields: [
      { key: "botToken", label: "Bot Token", placeholder: "MTk...", type: "password", help: "From Discord Developer Portal" },
      { key: "applicationId", label: "Application ID", placeholder: "1234567890", type: "text", help: "Your Discord application ID" },
    ],
    setupGuide: [
      "Go to discord.com/developers and create a new application",
      "Create a Bot in the Bot section",
      "Copy the bot token and paste it here",
      "Invite the bot to your server with message permissions",
    ],
    comingSoon: true,
  },
];

export default function ChannelsPage() {
  const [channelList, setChannelList] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const data = await channels.list();
      setChannelList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getChannel = (type: string) => channelList.find((c) => c.type === type);

  const openSetup = (type: string) => {
    const existing = getChannel(type);
    if (existing) {
      setFormData(existing.config || {});
    } else {
      setFormData({});
    }
    setSelectedType(type);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    if (!selectedType) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const channelDef = CHANNEL_TYPES.find((c) => c.type === selectedType);
      // Validate required fields
      for (const field of channelDef?.fields || []) {
        if (!formData[field.key]?.trim()) {
          setError(`${field.label} is required`);
          setSaving(false);
          return;
        }
      }

      const result = await channels.upsert({
        type: selectedType,
        name: channelDef?.label || selectedType,
        config: formData,
        isActive: true,
      });

      setSuccess(`${channelDef?.label} connected successfully! 🎉`);
      await loadChannels();

      // Show webhook URL if available
      if (result.webhookUrl) {
        setFormData((prev) => ({ ...prev, _webhookUrl: result.webhookUrl }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to save channel");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async (type: string) => {
    if (!confirm("Are you sure you want to disconnect this channel?")) return;
    try {
      await channels.remove(type);
      await loadChannels();
      setSelectedType(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const selectedDef = CHANNEL_TYPES.find((c) => c.type === selectedType);
  const selectedChannel = selectedType ? getChannel(selectedType) : null;

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Share2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>
              Channels
            </h1>
            <p className="text-gray-500 text-[15px]">
              Connect your AI bot to WhatsApp, Telegram, Slack & more
            </p>
          </div>
        </div>
      </div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {CHANNEL_TYPES.map((ch) => {
          const connected = getChannel(ch.type);
          return (
            <button
              key={ch.type}
              onClick={() => !ch.comingSoon && openSetup(ch.type)}
              disabled={ch.comingSoon}
              className={`relative bg-white rounded-2xl p-5 border text-left transition-all duration-200 ${
                ch.comingSoon
                  ? "opacity-60 cursor-not-allowed border-gray-100"
                  : connected
                  ? "border-green-200 hover:shadow-md hover:-translate-y-0.5 ring-1 ring-green-100"
                  : "border-gray-100 hover:shadow-md hover:-translate-y-0.5 hover:border-gray-200"
              }`}
            >
              {connected && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-600 border border-green-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Connected
                  </span>
                </div>
              )}
              {ch.comingSoon && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                    Coming Soon
                  </span>
                </div>
              )}
              <div className="text-3xl mb-3">{ch.icon}</div>
              <h3 className="text-base font-bold text-gray-900 mb-1">{ch.label}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{ch.description}</p>
              {!ch.comingSoon && !connected && (
                <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: ch.color }}>
                  <Plus size={14} /> Connect
                </div>
              )}
              {connected && (
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-400">
                  <ChevronRight size={14} /> Configure
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Setup Panel */}
      {selectedType && selectedDef && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${selectedDef.bg} flex items-center justify-center text-xl`}>
                {selectedDef.icon}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>
                  {selectedDef.label} Setup
                </h2>
                <p className="text-xs text-gray-400">
                  {selectedChannel ? "Manage your connection" : "Connect your bot"}
                </p>
              </div>
            </div>
            <button onClick={() => setSelectedType(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Form */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Zap size={14} /> Configuration
              </h3>

              <div className="space-y-4">
                {selectedDef.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={formData[field.key] || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#e85d04]/20 focus:border-[#e85d04] outline-none transition-all bg-gray-50 focus:bg-white"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">{field.help}</p>
                  </div>
                ))}
              </div>

              {/* Webhook URL */}
              {(selectedChannel || formData._webhookUrl) && (
                <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Webhook URL
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-gray-600 break-all bg-white px-3 py-2 rounded-lg border border-gray-200">
                      {formData._webhookUrl || `${window.location.origin}/api/channels/${selectedType}/webhook?t=YOUR_TENANT_ID`}
                    </code>
                    <button
                      onClick={() => copyText(formData._webhookUrl || "", "webhook")}
                      className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      {copied === "webhook" ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Error / Success */}
              {error && (
                <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              {success && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-100">
                  <Check size={14} /> {success}
                </div>
              )}

              {/* Actions */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                  style={{ background: saving ? "#ccc" : "#e85d04" }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {selectedChannel ? "Update" : "Connect"}
                </button>
                {selectedChannel && (
                  <button
                    onClick={() => handleDisconnect(selectedType)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-all border border-red-100"
                  >
                    <X size={14} /> Disconnect
                  </button>
                )}
              </div>
            </div>

            {/* Right: Setup Guide */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <MessageCircle size={14} /> Setup Guide
              </h3>
              <div className="space-y-3">
                {selectedDef.setupGuide.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ background: selectedDef.color }}>
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              {/* How it works */}
              <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-orange-50/30 rounded-xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">How it works</h4>
                <div className="space-y-2 text-xs text-gray-500 leading-relaxed">
                  <p>1. User sends a message on {selectedDef.label}</p>
                  <p>2. {selectedDef.label} forwards it to ActionBot via webhook</p>
                  <p>3. ActionBot processes with AI + your tools/actions</p>
                  <p>4. Response is sent back to the user on {selectedDef.label}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no channel selected */}
      {!selectedType && channelList.length === 0 && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <Share2 size={40} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>
            No channels connected
          </h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Connect your AI bot to messaging platforms like WhatsApp, Telegram, and Slack to reach users where they already are.
          </p>
        </div>
      )}
    </div>
  );
}
