"use client";
import { useEffect, useRef, useState } from "react";
import { admin } from "@/lib/api";
import {
  Play, Send, RotateCcw, Bot, User, Wrench,
  CheckCircle2, XCircle, Loader2, Sparkles,
  ChevronDown, ChevronRight, Clock,
} from "lucide-react";

interface Message {
  role: "user" | "bot" | "tool" | "tool_result" | "error" | "typing";
  content: string;
  toolName?: string;
  toolInput?: string;
  timestamp: Date;
}

export default function PlaygroundPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [botConfig, setBotConfig] = useState<any>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [expandedTools, setExpandedTools] = useState<Set<number>>(new Set());
  const [messageCount, setMessageCount] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    admin.getBotConfig().then(setBotConfig).catch(console.error);
    admin.getWidgetCode().then((data) => setApiKey(data?.apiKey)).catch(console.error);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending || !apiKey) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg, timestamp: new Date() }]);
    setMessages((prev) => [...prev, { role: "typing", content: "", timestamp: new Date() }]);
    setSending(true);
    setMessageCount((c) => c + 1);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
        body: JSON.stringify({ message: userMsg, sessionId }),
      });

      const data = await res.json();

      // Remove typing indicator
      setMessages((prev) => prev.filter((m) => m.role !== "typing"));

      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId);
      }

      if (data.type === "text") {
        setMessages((prev) => [...prev, { role: "bot", content: data.content, timestamp: new Date() }]);
      } else if (data.type === "confirmation_required") {
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: data.content, timestamp: new Date() },
          { role: "tool", content: `⚠️ Action requires confirmation: ${data.confirmation?.summary}`, toolName: data.confirmation?.toolName, timestamp: new Date() },
        ]);
      } else if (data.type === "error") {
        setMessages((prev) => [...prev, { role: "error", content: data.content || data.errorDetail || "Something went wrong", timestamp: new Date() }]);
      }

      // Add attachments info if any
      if (data.attachments?.length) {
        setMessages((prev) => [
          ...prev,
          { role: "tool_result", content: `📎 ${data.attachments.length} attachment(s) returned`, timestamp: new Date() },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.role !== "typing"));
      setMessages((prev) => [...prev, { role: "error", content: err.message || "Failed to send", timestamp: new Date() }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setSessionId(null);
    setMessageCount(0);
    inputRef.current?.focus();
  };

  const toggleTool = (index: number) => {
    setExpandedTools((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Play size={18} className="text-white ml-0.5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>
              Playground
            </h1>
            <p className="text-gray-500 text-sm">Test your bot before going live</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {sessionId && (
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg font-mono">
              Session: {sessionId.slice(0, 8)}...
            </span>
          )}
          <button
            onClick={resetChat}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
          >
            <RotateCcw size={14} /> New Chat
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: "calc(100vh - 220px)", display: "flex", flexDirection: "column" }}>
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="w-9 h-9 rounded-xl bg-[#e85d04] flex items-center justify-center text-white text-lg">
            {botConfig?.avatarUrl || "🤖"}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-900">{botConfig?.name || "AI Assistant"}</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-400">Online · {botConfig?.personality || "professional"}</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
            {messageCount} messages
          </div>
        </div>

        {/* Messages */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4" style={{ scrollBehavior: "smooth" }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-[#e85d04]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-serif)" }}>
                Test your bot
              </h3>
              <p className="text-sm text-gray-400 max-w-sm">
                Send a message to see how your AI assistant responds. Tool calls, knowledge base, and actions will work just like in production.
              </p>
              {botConfig?.quickReplies?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 justify-center">
                  {botConfig.quickReplies.map((qr: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => { setInput(qr); }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-orange-50 text-[#e85d04] border border-orange-100 hover:bg-orange-100 transition-all"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.role === "typing") {
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#e85d04] flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              );
            }

            if (msg.role === "user") {
              return (
                <div key={i} className="flex items-start gap-2.5 justify-end">
                  <div className="max-w-[75%]">
                    <div className="bg-[#e85d04] text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
                      {msg.content}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 text-right flex items-center justify-end gap-1">
                      <Clock size={9} /> {formatTime(msg.timestamp)}
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-gray-500" />
                  </div>
                </div>
              );
            }

            if (msg.role === "bot") {
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#e85d04] flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="max-w-[75%]">
                    <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                      {msg.content}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={9} /> {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            }

            if (msg.role === "tool") {
              return (
                <div key={i} className="flex items-start gap-2.5 ml-9">
                  <div className="w-full max-w-[75%]">
                    <button
                      onClick={() => toggleTool(i)}
                      className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 hover:bg-blue-100 transition-all w-full text-left"
                    >
                      <Wrench size={12} />
                      <span className="flex-1">{msg.toolName || "Tool Call"}</span>
                      {expandedTools.has(i) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                    {expandedTools.has(i) && (
                      <div className="mt-1 bg-gray-900 text-green-400 rounded-xl px-3 py-2 text-xs font-mono whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            if (msg.role === "tool_result") {
              return (
                <div key={i} className="flex items-start gap-2.5 ml-9">
                  <div className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                    <CheckCircle2 size={12} />
                    {msg.content}
                  </div>
                </div>
              );
            }

            if (msg.role === "error") {
              return (
                <div key={i} className="flex items-start gap-2.5 ml-9">
                  <div className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    <XCircle size={12} />
                    {msg.content}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 px-4 py-3 bg-white">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={apiKey ? "Type a message to test your bot..." : "Loading API key..."}
              disabled={!apiKey || sending}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#e85d04]/20 focus:border-[#e85d04] outline-none transition-all bg-gray-50 focus:bg-white disabled:opacity-50"
              autoFocus
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending || !apiKey}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40"
              style={{ background: "#e85d04" }}
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            Messages are processed through your actual AI configuration — tools, knowledge base, and actions are active
          </p>
        </div>
      </div>
    </div>
  );
}
