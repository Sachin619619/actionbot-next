"use client";

import { useEffect, useState, useRef } from "react";
import { admin } from "@/lib/api";
import {
  Copy, Check, Code, Key, Eye, Palette, MessageCircle,
  ExternalLink, Smartphone, Monitor, Tablet, Bot,
  Send, X, Sparkles, Globe,
} from "lucide-react";

const DEMO_MESSAGES = [
  { role: "bot", text: "Hi! 👋 How can I help you today?" },
  { role: "user", text: "What services do you offer?" },
  { role: "bot", text: "We offer a wide range of AI-powered solutions including:\n\n• Customer support automation\n• Knowledge base management\n• Multi-channel integrations\n\nWould you like to know more about any of these?" },
];

export default function WidgetPage() {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [chatOpen, setChatOpen] = useState(true);
  const [demoMessages, setDemoMessages] = useState(DEMO_MESSAGES);
  const [demoInput, setDemoInput] = useState("");
  const [botConfig, setBotConfig] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    admin.getWidgetCode().then(setData).catch(console.error);
    admin.getBotConfig().then(setBotConfig).catch(console.error);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [demoMessages]);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const sendDemoMessage = () => {
    if (!demoInput.trim()) return;
    setDemoMessages([
      ...demoMessages,
      { role: "user", text: demoInput.trim() },
    ]);
    const input = demoInput.trim();
    setDemoInput("");
    // Simulate bot reply
    setTimeout(() => {
      setDemoMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: `Thanks for your message! In production, your AI bot would process "${input}" and respond based on your tools and knowledge base. 🚀`,
        },
      ]);
    }, 1200);
  };

  const themeColor = botConfig?.themeColor || "#e85d04";
  const botName = botConfig?.name || "AI Assistant";

  if (!data)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#e85d04] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const deviceWidths = { desktop: "w-full", tablet: "max-w-[768px]", mobile: "max-w-[375px]" };

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Code size={20} className="text-white" />
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
            >
              Chat Widget
            </h1>
            <p className="text-gray-500 text-[15px]">Embed your AI assistant on any website</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column — Code & Config */}
        <div className="space-y-5">
          {/* API Key */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Key size={16} className="text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">API Key</h2>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <code className="flex-1 text-sm font-mono text-gray-700 break-all">{data.apiKey}</code>
              <button
                onClick={() => copyText(data.apiKey, "apikey")}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0"
              >
                {copied === "apikey" ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Embed Code */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Code size={16} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Embed Code</h2>
                  <p className="text-[11px] text-gray-400">
                    Paste before closing &lt;/body&gt; tag
                  </p>
                </div>
              </div>
              <button
                onClick={() => copyText(data.embedCode, "embed")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#e85d04] text-white hover:bg-[#d45304] transition-colors"
              >
                {copied === "embed" ? <Check size={12} /> : <Copy size={12} />}
                {copied === "embed" ? "Copied!" : "Copy Code"}
              </button>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap break-all leading-relaxed">
                {data.embedCode}
              </pre>
            </div>
          </div>

          {/* Quick Setup Steps */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-500" />
              Quick Setup
            </h3>
            <div className="space-y-3">
              {[
                { step: 1, text: "Copy the embed code above", icon: Copy },
                { step: 2, text: "Paste it in your HTML before </body>", icon: Code },
                { step: 3, text: "The chat bubble appears automatically", icon: MessageCircle },
                { step: 4, text: "Your bot uses your configured tools & knowledge", icon: Bot },
              ].map(({ step, text, icon: Icon }) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {step}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Icon size={14} className="text-blue-400" />
                    {text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customization Hint */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Palette size={16} className="text-purple-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Customization</h2>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Customize your widget's appearance in the Bot Config page.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Theme Color</p>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border border-gray-200" style={{ background: themeColor }} />
                  <code className="text-xs font-mono text-gray-600">{themeColor}</code>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Bot Name</p>
                <p className="text-sm font-medium text-gray-700">{botName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — Live Preview */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
            {/* Preview Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-gray-500" />
                <h2 className="text-base font-bold text-gray-900">Live Preview</h2>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {[
                  { key: "desktop" as const, icon: Monitor },
                  { key: "tablet" as const, icon: Tablet },
                  { key: "mobile" as const, icon: Smartphone },
                ].map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setPreviewDevice(key)}
                    className={`p-1.5 rounded-md transition-colors ${
                      previewDevice === key ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Area */}
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-[500px] flex items-end justify-center">
              <div className={`${deviceWidths[previewDevice]} w-full transition-all duration-300 relative`}>
                {/* Simulated webpage background */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 h-[460px] relative overflow-hidden">
                  {/* Fake browser bar */}
                  <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 flex items-center gap-1.5 bg-white rounded-lg px-3 py-1 border border-gray-200 ml-2">
                      <Globe size={10} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400 font-mono">yourwebsite.com</span>
                    </div>
                  </div>

                  {/* Fake website content */}
                  <div className="p-6">
                    <div className="h-3 w-32 bg-gray-200 rounded mb-3" />
                    <div className="h-2 w-full bg-gray-100 rounded mb-2" />
                    <div className="h-2 w-3/4 bg-gray-100 rounded mb-4" />
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="h-16 bg-gray-100 rounded-lg" />
                      <div className="h-16 bg-gray-100 rounded-lg" />
                      <div className="h-16 bg-gray-100 rounded-lg" />
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded mb-2" />
                    <div className="h-2 w-5/6 bg-gray-100 rounded" />
                  </div>

                  {/* Chat Widget */}
                  {chatOpen ? (
                    <div
                      className="absolute bottom-4 right-4 w-[280px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
                      style={{ height: "360px" }}
                    >
                      {/* Chat Header */}
                      <div
                        className="px-4 py-3 flex items-center gap-2"
                        style={{ background: themeColor }}
                      >
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                          <Bot size={14} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-xs font-semibold">{botName}</p>
                          <p className="text-white/70 text-[10px]">Online now</p>
                        </div>
                        <button
                          onClick={() => setChatOpen(false)}
                          className="p-1 rounded-full hover:bg-white/20 transition-colors"
                        >
                          <X size={14} className="text-white/80" />
                        </button>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                        {demoMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] px-3 py-2 text-[11px] leading-relaxed ${
                                msg.role === "user"
                                  ? "rounded-2xl rounded-br-sm text-white"
                                  : "bg-white rounded-2xl rounded-bl-sm text-gray-800 border border-gray-100 shadow-sm"
                              }`}
                              style={msg.role === "user" ? { background: themeColor } : {}}
                            >
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Input */}
                      <div className="p-2 border-t border-gray-100 bg-white">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={demoInput}
                            onChange={(e) => setDemoInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendDemoMessage()}
                            placeholder="Type a message..."
                            className="flex-1 text-[11px] px-3 py-2 rounded-full bg-gray-50 outline-none border border-gray-200 focus:border-gray-300"
                          />
                          <button
                            onClick={sendDemoMessage}
                            disabled={!demoInput.trim()}
                            className="p-2 rounded-full text-white transition-colors disabled:opacity-40"
                            style={{ background: themeColor }}
                          >
                            <Send size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setChatOpen(true)}
                      className="absolute bottom-4 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform"
                      style={{ background: themeColor }}
                    >
                      <MessageCircle size={22} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-[11px] text-gray-400">
                Interactive preview — try typing a message!
              </p>
              <button
                onClick={() => {
                  setDemoMessages(DEMO_MESSAGES);
                  setChatOpen(true);
                }}
                className="text-xs text-[#e85d04] font-medium hover:underline"
              >
                Reset Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
