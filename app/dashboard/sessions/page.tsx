"use client";

import { useEffect, useState } from "react";
import { admin } from "@/lib/api";
import { MessageSquare, ArrowLeft, User, Bot, Wrench } from "lucide-react";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => { admin.getSessions().then(setSessions).catch(console.error); }, []);

  const viewSession = async (id: string) => {
    setSelectedSession(id);
    const msgs = await admin.getSessionMessages(id);
    setMessages(msgs);
  };

  if (selectedSession) {
    return (
      <div className="animate-fade-in-up">
        <button onClick={() => { setSelectedSession(null); setMessages([]); }} className="flex items-center gap-2 text-[#1B1C15]/60 hover:text-[#1B1C15] mb-6 text-[15px] font-medium transition-colors">
          <ArrowLeft size={18} /> Back to sessions
        </button>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1B1C15] mb-6">Chat Transcript</h1>
        <div className="premium-card p-4 sm:p-6 space-y-4 max-w-2xl">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role !== "user" && (
                <div className="w-8 h-8 rounded-xl bg-[#f5eed8] flex items-center justify-center flex-shrink-0">
                  {msg.role === "tool_result" ? <Wrench size={14} className="text-[#1B1C15]/60" /> : <Bot size={14} className="text-[#1B1C15]/60" />}
                </div>
              )}
              <div className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user" ? "bg-[#1B1C15] text-white"
                  : msg.role === "tool_result" ? "bg-[#FFFAEB] text-[#1B1C15] border border-[rgba(0,0,0,0.06)]"
                  : "bg-white text-[#1B1C15] border border-[rgba(0,0,0,0.06)]"
              }`}>
                {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                {msg.toolCall && <div className="mt-2 text-xs opacity-60">Tool: <strong>{(msg.toolCall as any).name}</strong></div>}
                {msg.toolResult && <pre className="mt-2 text-xs overflow-x-auto bg-[rgba(0,0,0,0.03)] rounded-lg p-2">{JSON.stringify((msg.toolResult as any).output, null, 2)}</pre>}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-[#e8e0cc] flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-[#1B1C15]/60" />
                </div>
              )}
            </div>
          ))}
          {messages.length === 0 && <p className="text-[rgba(0,0,0,0.35)] text-center py-8">No messages in this session</p>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1B1C15]">Chat Sessions</h1>
        <p className="text-[rgba(0,0,0,0.5)] mt-1 text-[15px]">Monitor conversations with your users</p>
      </div>
      {sessions.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <div className="w-16 h-16 bg-[#f5eed8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={28} className="text-[#1B1C15]/30" />
          </div>
          <p className="text-[rgba(0,0,0,0.5)] text-[15px]">No chat sessions yet. Start chatting via the widget!</p>
        </div>
      ) : (
        <>
          <div className="hidden sm:block premium-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.06)]">
                  <th className="text-left px-6 py-4 text-[11px] font-semibold text-[rgba(0,0,0,0.4)] uppercase tracking-wider">Session</th>
                  <th className="text-left px-6 py-4 text-[11px] font-semibold text-[rgba(0,0,0,0.4)] uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-4 text-[11px] font-semibold text-[rgba(0,0,0,0.4)] uppercase tracking-wider">Messages</th>
                  <th className="text-left px-6 py-4 text-[11px] font-semibold text-[rgba(0,0,0,0.4)] uppercase tracking-wider">Started</th>
                  <th className="text-left px-6 py-4 text-[11px] font-semibold text-[rgba(0,0,0,0.4)] uppercase tracking-wider">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} onClick={() => viewSession(s.id)} className="border-b border-[rgba(0,0,0,0.04)] last:border-0 hover:bg-[#FFFAEB] cursor-pointer transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-[#1B1C15]/60">{s.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-sm text-[#1B1C15]">{s.externalUserId || "Anonymous"}</td>
                    <td className="px-6 py-4"><span className="pill pill-active text-[11px]">{s.messageCount}</span></td>
                    <td className="px-6 py-4 text-sm text-[rgba(0,0,0,0.5)]">{new Date(s.startedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-[rgba(0,0,0,0.5)]">{s.lastMessageAt ? new Date(s.lastMessageAt).toLocaleString() : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sm:hidden space-y-3 stagger-children">
            {sessions.map((s) => (
              <div key={s.id} onClick={() => viewSession(s.id)} className="premium-card p-4 cursor-pointer active:scale-[0.98] transition-transform">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[#1B1C15]">{s.externalUserId || "Anonymous"}</span>
                  <span className="pill pill-active text-[11px]">{s.messageCount} msgs</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[rgba(0,0,0,0.4)]">
                  <span className="font-mono">{s.id.slice(0, 8)}...</span>
                  <span>{s.lastMessageAt ? new Date(s.lastMessageAt).toLocaleString() : new Date(s.startedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
