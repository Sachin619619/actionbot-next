"use client";
import { useEffect, useState } from "react";
import { admin, auth } from "@/lib/api";
import {
  MessageSquare, Users, Activity, Clock,
  Copy, Check, Bot, ArrowRight, ExternalLink,
  Zap, ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [botConfig, setBotConfig] = useState<any>(null);
  const [widgetData, setWidgetData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    admin.stats().then(setStats).catch(console.error);
    admin.getBotConfig().then(setBotConfig).catch(console.error);
    admin.getWidgetCode().then(setWidgetData).catch(console.error);
    admin.getSessions().then((data) => setSessions(Array.isArray(data) ? data.slice(0, 5) : [])).catch(console.error);
    auth.me().then(setUser).catch(console.error);
  }, []);

  const copyEmbed = () => {
    if (!widgetData?.embedCode) return;
    navigator.clipboard.writeText(widgetData.embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statCards = [
    {
      label: "Total Sessions",
      value: stats?.sessionCount ?? "--",
      icon: Users,
      change: "+12%",
      color: "#e85d04",
      bg: "bg-orange-50",
    },
    {
      label: "Messages Today",
      value: stats?.messageCount ?? "--",
      icon: MessageSquare,
      change: "+8%",
      color: "#2563eb",
      bg: "bg-blue-50",
    },
    {
      label: "Active Tools",
      value: stats?.activeTools ?? "--",
      icon: Activity,
      change: `${stats?.toolCount ?? 0} total`,
      color: "#16a34a",
      bg: "bg-green-50",
    },
    {
      label: "Avg Response Time",
      value: "1.2s",
      icon: Clock,
      change: "-5%",
      color: "#9333ea",
      bg: "bg-purple-50",
    },
  ];

  const placeholderSessions = [
    { id: "1", visitor: "Visitor #1042", messages: 8, time: "2 min ago", status: "active" },
    { id: "2", visitor: "Visitor #1041", messages: 5, time: "15 min ago", status: "ended" },
    { id: "3", visitor: "Visitor #1040", messages: 12, time: "1 hr ago", status: "ended" },
    { id: "4", visitor: "Visitor #1039", messages: 3, time: "2 hrs ago", status: "ended" },
    { id: "5", visitor: "Visitor #1038", messages: 7, time: "3 hrs ago", status: "ended" },
  ];

  const displaySessions = sessions.length > 0
    ? sessions.map((s: any, i: number) => ({
        id: s.id,
        visitor: `Session #${s.id?.slice(-4) || i + 1}`,
        messages: s._count?.messages ?? s.messageCount ?? "—",
        time: s.createdAt ? new Date(s.createdAt).toLocaleString() : "—",
        status: s.endedAt ? "ended" : "active",
      }))
    : placeholderSessions;

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-gray-500 mt-1 text-[15px]">
          Here&apos;s what&apos;s happening with your AI assistant today
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 stagger-children">
        {statCards.map(({ label, value, icon: Icon, change, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`${bg} w-10 h-10 rounded-xl flex items-center justify-center`}>
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-xs font-medium text-gray-400">{change}</span>
            </div>
            <p className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1" style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>
              {value}
            </p>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-8">
        {/* Quick Setup - wider */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <Zap size={18} className="text-[#e85d04]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>
                  Quick Setup
                </h2>
                <p className="text-xs text-gray-400">Embed your bot in seconds</p>
              </div>
            </div>
            <button
              onClick={copyEmbed}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: copied ? "#16a34a" : "#e85d04",
                color: "white",
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-4 sm:p-5 overflow-x-auto">
            <pre className="text-sm text-green-400 font-mono leading-relaxed whitespace-pre-wrap break-all">
              {widgetData?.embedCode || '<script src="https://actionbot.app/widget.js" data-key="loading..."></script>'}
            </pre>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Paste this snippet before the closing <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-mono">&lt;/body&gt;</code> tag on your website.
          </p>
        </div>

        {/* Bot Config Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Bot size={18} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>
                  Bot Config
                </h2>
                <p className="text-xs text-gray-400">Current configuration</p>
              </div>
            </div>
            <Link
              href="/dashboard/bot"
              className="text-xs font-medium text-[#e85d04] hover:text-[#d45304] flex items-center gap-1 transition-colors"
            >
              Edit <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Bot Name</p>
              <p className="text-sm font-semibold text-gray-900">{botConfig?.name || "Loading..."}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Model</p>
              <p className="text-sm text-gray-600">{botConfig?.model || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">System Prompt</p>
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                {botConfig?.systemPrompt
                  ? botConfig.systemPrompt.length > 200
                    ? botConfig.systemPrompt.slice(0, 200) + "..."
                    : botConfig.systemPrompt
                  : "No system prompt configured"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Personality</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-[#e85d04] border border-orange-100">
                {botConfig?.personality || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 sm:px-8 sm:py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <MessageSquare size={18} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>
                Recent Sessions
              </h2>
              <p className="text-xs text-gray-400">Latest chat interactions</p>
            </div>
          </div>
          <Link
            href="/dashboard/sessions"
            className="text-xs font-medium text-[#e85d04] hover:text-[#d45304] flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="divide-y divide-gray-50">
          {displaySessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between px-6 sm:px-8 py-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users size={15} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{session.visitor}</p>
                  <p className="text-xs text-gray-400">{session.messages} messages</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400 hidden sm:block">{session.time}</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
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
              </div>
            </div>
          ))}
        </div>

        {displaySessions.length === 0 && (
          <div className="px-8 py-12 text-center">
            <MessageSquare size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">No sessions yet. Embed the widget to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
