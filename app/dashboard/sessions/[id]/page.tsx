"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { admin } from "@/lib/api";
import {
  ArrowLeft, Bot, User, Clock, Calendar,
  Hash, Download, Mail, Wrench, Info,
  MessageSquare, Copy, Check, Send, UserCheck,
  RefreshCw, Headphones,
} from "lucide-react";

function formatDuration(ms: number): string {
  if (ms < 1000) return "< 1 second";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatTimestamp(date: string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFullDate(date: string): string {
  return new Date(date).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Human handoff state
  const [handoffMode, setHandoffMode] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadSession = () => {
    if (!sessionId) return;
    admin
      .getSession(sessionId)
      .then((data) => {
        setSession(data);
        setError(null);
      })
      .catch((err: any) => setError(err.message || "Failed to load session"));
  };

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    admin
      .getSession(sessionId)
      .then(setSession)
      .catch((err: any) => setError(err.message || "Failed to load session"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Auto-refresh when handoff mode is active
  useEffect(() => {
    if (!handoffMode || !autoRefresh) return;
    const interval = setInterval(loadSession, 5000);
    return () => clearInterval(interval);
  }, [handoffMode, autoRefresh, sessionId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (handoffMode && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [session?.messages?.length, handoffMode]);

  // Focus input when entering handoff mode
  useEffect(() => {
    if (handoffMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [handoffMode]);

  const sendReply = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      const newMsg = await admin.replyToSession(sessionId, replyText.trim());
      // Add new message to local state
      setSession((prev: any) => ({
        ...prev,
        messages: [...prev.messages, newMsg],
        messageCount: prev.messageCount + 1,
        assistantMessageCount: prev.assistantMessageCount + 1,
      }));
      setReplyText("");
      inputRef.current?.focus();
    } catch (err: any) {
      alert("Failed to send: " + (err.message || "Unknown error"));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  const exportConversation = () => {
    if (!session) return;
    const lines: string[] = [];
    lines.push(`Chat Session: ${session.id}`);
    lines.push(`User: ${session.externalUserId || "Anonymous"}`);
    lines.push(`Started: ${formatFullDate(session.startedAt)}`);
    if (session.lastMessageAt) {
      lines.push(`Ended: ${formatFullDate(session.lastMessageAt)}`);
    }
    lines.push(`Duration: ${formatDuration(session.durationMs)}`);
    lines.push(`Total Messages: ${session.messageCount}`);
    lines.push("");
    lines.push("─".repeat(60));
    lines.push("");

    session.messages.forEach((msg: any) => {
      const time = formatTimestamp(msg.createdAt);
      const isHuman = msg.toolCall?._humanAgent;
      const role = msg.role === "user" ? "User" : isHuman ? "Agent" : msg.role === "assistant" ? "Bot" : msg.role;
      lines.push(`[${time}] ${role}:`);
      if (msg.content) lines.push(msg.content);
      if (msg.toolCall && !isHuman) {
        lines.push(`  [Tool Call: ${(msg.toolCall as any).name || "unknown"}]`);
        lines.push(`  Params: ${JSON.stringify((msg.toolCall as any).arguments || msg.toolCall, null, 2)}`);
      }
      if (msg.toolResult) {
        lines.push(`  [Tool Result]`);
        lines.push(`  ${JSON.stringify((msg.toolResult as any).output || msg.toolResult, null, 2)}`);
      }
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${session.id.slice(0, 8)}-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!session) return;
    const data = {
      sessionId: session.id,
      userId: session.externalUserId || "anonymous",
      startedAt: session.startedAt,
      endedAt: session.lastMessageAt,
      messageCount: session.messageCount,
      metadata: session.metadata,
      messages: session.messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        toolCall: msg.toolCall || undefined,
        toolResult: msg.toolResult || undefined,
        timestamp: msg.createdAt,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-${session.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-8 h-8 border-2 border-[#e85d04] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-[1000px] mx-auto">
        <button
          onClick={() => router.push("/dashboard/sessions")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Back to Sessions
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Info size={28} className="text-red-400" />
          </div>
          <p className="text-gray-700 font-semibold mb-1">Session Not Found</p>
          <p className="text-sm text-gray-400">{error || "This session does not exist or has been deleted."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard/sessions")}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 text-sm font-medium transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Sessions
      </button>

      {/* Session Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1
                className="text-xl sm:text-2xl font-bold text-gray-900"
                style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
              >
                Session Detail
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  session.status === "active"
                    ? "bg-green-50 text-green-600 border border-green-100"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {session.status === "active" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                )}
                {session.status === "active" ? "Active" : "Ended"}
              </span>
              {handoffMode && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-600 border border-purple-100">
                  <Headphones size={10} className="mr-1" />
                  Live Takeover
                </span>
              )}
            </div>
            <button
              onClick={copySessionId}
              className="flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-gray-600 transition-colors"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              {sessionId}
            </button>
          </div>

          <div className="flex items-center gap-2 self-start flex-wrap">
            {/* Human Handoff Toggle */}
            <button
              onClick={() => {
                setHandoffMode(!handoffMode);
                if (!handoffMode) setAutoRefresh(true);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                handoffMode
                  ? "bg-purple-600 text-white hover:bg-purple-700 shadow-sm shadow-purple-200"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
              }`}
            >
              <Headphones size={14} />
              {handoffMode ? "Exit Takeover" : "Take Over"}
            </button>
            <button
              onClick={exportConversation}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#e85d04] text-white hover:bg-[#d45304] shadow-sm transition-all duration-200"
            >
              <Download size={14} />
              TXT
            </button>
            <button
              onClick={exportJSON}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
            >
              <Download size={14} />
              JSON
            </button>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <User size={14} className="text-gray-400" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">User</p>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {session.externalUserId || "Anonymous"}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={14} className="text-gray-400" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Started</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {new Date(session.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
            <p className="text-[11px] text-gray-400">
              {new Date(session.startedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-gray-400" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Duration</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">{formatDuration(session.durationMs)}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} className="text-gray-400" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Messages</p>
            </div>
            <p className="text-sm font-semibold text-gray-900">{session.messageCount}</p>
            <p className="text-[11px] text-gray-400">
              {session.userMessageCount} user / {session.assistantMessageCount} bot
            </p>
          </div>
        </div>

        {/* Metadata */}
        {session.metadata && Object.keys(session.metadata).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Session Metadata</p>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <pre className="text-xs text-gray-600 font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(session.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Handoff Info Banner */}
      {handoffMode && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 mb-6 border border-purple-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Headphones size={18} className="text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-900">Live Chat Takeover Active</p>
            <p className="text-xs text-purple-600">You're responding as a human agent. Messages appear as bot replies to the user.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSession}
              className="p-2 rounded-lg hover:bg-purple-100 transition-colors"
              title="Refresh messages"
            >
              <RefreshCw size={14} className="text-purple-500" />
            </button>
            <label className="flex items-center gap-1.5 text-xs text-purple-600 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
              />
              Auto-refresh
            </label>
          </div>
        </div>
      )}

      {/* Conversation Thread */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <MessageSquare size={18} className="text-[#e85d04]" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
              >
                Conversation
              </h2>
              <p className="text-xs text-gray-400">{session.messageCount} messages in this session</p>
            </div>
          </div>
        </div>

        <div className={`p-4 sm:p-6 space-y-4 overflow-y-auto ${handoffMode ? "max-h-[500px]" : "max-h-[600px]"}`}>
          {session.messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">No messages in this session</p>
            </div>
          ) : (
            session.messages.map((msg: any, index: number) => {
              const isUser = msg.role === "user";
              const isTool = msg.role === "tool_result" || msg.role === "tool";
              const isHuman = msg.toolCall?._humanAgent;
              const isAssistant = msg.role === "assistant";

              const prevMsg = index > 0 ? session.messages[index - 1] : null;
              const showDateSep =
                !prevMsg ||
                new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

              return (
                <div key={msg.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 border-t border-gray-100" />
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                        {new Date(msg.createdAt).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <div className="flex-1 border-t border-gray-100" />
                    </div>
                  )}

                  <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                    {!isUser && (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                          isTool
                            ? "bg-amber-50 border border-amber-100"
                            : isHuman
                            ? "bg-purple-50 border border-purple-100"
                            : "bg-orange-50 border border-orange-100"
                        }`}
                      >
                        {isTool ? (
                          <Wrench size={13} className="text-amber-500" />
                        ) : isHuman ? (
                          <UserCheck size={13} className="text-purple-600" />
                        ) : (
                          <Bot size={13} className="text-[#e85d04]" />
                        )}
                      </div>
                    )}

                    <div className={`max-w-[75%] sm:max-w-[70%] group`}>
                      {/* Human agent badge */}
                      {isHuman && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 mb-1">
                          <UserCheck size={10} />
                          Human Agent
                        </span>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isUser
                            ? "bg-[#1a1a1a] text-white rounded-br-md"
                            : isTool
                            ? "bg-amber-50 text-gray-800 border border-amber-100 rounded-bl-md"
                            : isHuman
                            ? "bg-purple-50 text-gray-800 border border-purple-200 rounded-bl-md"
                            : "bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-md"
                        }`}
                      >
                        {msg.content && (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                        {msg.toolCall && !isHuman && (
                          <div className="mt-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                              <Wrench size={10} />
                              {(msg.toolCall as any).name || "Tool Call"}
                            </span>
                            <pre className="mt-2 text-xs overflow-x-auto bg-black/5 rounded-lg p-2 font-mono">
                              {JSON.stringify(
                                (msg.toolCall as any).arguments || msg.toolCall,
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        )}
                        {msg.toolResult && (
                          <div className="mt-2">
                            <span className="text-[11px] font-medium text-amber-600">Result:</span>
                            <pre className="mt-1 text-xs overflow-x-auto bg-black/5 rounded-lg p-2 font-mono">
                              {JSON.stringify(
                                (msg.toolResult as any).output || msg.toolResult,
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        )}
                      </div>
                      <p
                        className={`text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isUser ? "text-right" : "text-left"
                        }`}
                      >
                        {formatTimestamp(msg.createdAt)}
                      </p>
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center flex-shrink-0 mt-1">
                        <User size={13} className="text-white" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Human reply input */}
        {handoffMode && (
          <div className="border-t border-gray-100 p-4 bg-gradient-to-r from-purple-50/50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <UserCheck size={14} className="text-purple-600" />
              </div>
              <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-purple-200 px-4 py-2 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a reply as human agent..."
                  className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
                  disabled={sending}
                />
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim() || sending}
                  className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 disabled:hover:bg-purple-600 transition-colors"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-purple-400 mt-2 ml-11">
              Press Enter to send • Your message will appear to the user as a bot reply
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
