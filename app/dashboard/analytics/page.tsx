"use client";
import { useEffect, useState, useCallback } from "react";
import {
  BarChart3, MessageSquare, Users, Hash,
  TrendingUp, TrendingDown, Clock, Loader2,
  ChevronRight, RefreshCw, MessageCircle,
} from "lucide-react";

interface AnalyticsData {
  sessions: { today: number; thisWeek: number; thisMonth: number; allTime: number };
  messages: { sent: number; received: number; total: number };
  avgMessagesPerSession: number;
  uniqueUsers: number;
  mostActiveHours: { hour: number; count: number }[];
  popularFirstMessages: { message: string; count: number }[];
}

interface SessionItem {
  id: string;
  externalUserId: string | null;
  startedAt: string;
  lastMessageAt: string | null;
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
  firstUserMessage: string | null;
  lastMessagePreview: string | null;
  durationMs: number | null;
  isActive: boolean;
}

interface SessionsResponse {
  sessions: SessionItem[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("actionbot_token");
}

async function apiFetch<T>(path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

function formatDuration(ms: number | null): string {
  if (!ms || ms < 0) return "--";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatHour(hour: number): string {
  if (hour === 0) return "12a";
  if (hour < 12) return `${hour}a`;
  if (hour === 12) return "12p";
  return `${hour - 12}p`;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [pagination, setPagination] = useState<SessionsResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [analyticsData, sessionsData] = await Promise.all([
        apiFetch<AnalyticsData>("/api/admin/analytics"),
        apiFetch<SessionsResponse>("/api/admin/analytics/sessions?limit=10&offset=0"),
      ]);
      setAnalytics(analyticsData);
      setSessions(sessionsData.sessions);
      setPagination(sessionsData.pagination);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loadMore = async () => {
    if (!pagination?.hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextOffset = pagination.offset + pagination.limit;
      const data = await apiFetch<SessionsResponse>(
        `/api/admin/analytics/sessions?limit=10&offset=${nextOffset}`
      );
      setSessions((prev) => [...prev, ...data.sessions]);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to load more sessions:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#e85d04]" />
          <p className="text-sm text-gray-400 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const maxHourCount = analytics
    ? Math.max(...analytics.mostActiveHours.map((h) => h.count), 1)
    : 1;

  const weeklyTrend = analytics
    ? analytics.sessions.thisWeek > 0
      ? Math.round(((analytics.sessions.today * 7) / analytics.sessions.thisWeek - 1) * 100)
      : 0
    : 0;

  const statCards = [
    {
      label: "Total Sessions",
      value: analytics?.sessions.allTime ?? 0,
      subtitle: `${analytics?.sessions.today ?? 0} today`,
      icon: Users,
      trend: weeklyTrend,
      color: "#e85d04",
      bg: "bg-orange-50",
    },
    {
      label: "Total Messages",
      value: analytics?.messages.total ?? 0,
      subtitle: `${analytics?.messages.sent ?? 0} from users`,
      icon: MessageSquare,
      trend: null,
      color: "#2563eb",
      bg: "bg-blue-50",
    },
    {
      label: "Unique Users",
      value: analytics?.uniqueUsers ?? 0,
      subtitle: "identified visitors",
      icon: Hash,
      trend: null,
      color: "#16a34a",
      bg: "bg-green-50",
    },
    {
      label: "Avg Msgs/Session",
      value: analytics?.avgMessagesPerSession ?? 0,
      subtitle: "messages per chat",
      icon: BarChart3,
      trend: null,
      color: "#9333ea",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-900"
            style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
          >
            Analytics
          </h1>
          <p className="text-gray-500 mt-1 text-[15px]">
            Deep dive into your bot&apos;s performance and engagement
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 stagger-children">
        {statCards.map(({ label, value, subtitle, icon: Icon, trend, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${bg} w-10 h-10 rounded-xl flex items-center justify-center`}>
                <Icon size={18} style={{ color }} />
              </div>
              {trend !== null && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-semibold ${
                    trend >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {trend >= 0 ? "+" : ""}
                  {trend}%
                </span>
              )}
              {trend === null && (
                <span className="text-xs font-medium text-gray-400">{subtitle}</span>
              )}
            </div>
            <p
              className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1"
              style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
            >
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {label}
            </p>
            {trend !== null && (
              <p className="text-[11px] text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
        ))}
      </div>

      {/* Session Breakdown + Message Split */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Session breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Sessions Breakdown</p>
          <div className="space-y-3">
            {[
              { label: "Today", value: analytics?.sessions.today ?? 0, color: "#e85d04" },
              { label: "This Week", value: analytics?.sessions.thisWeek ?? 0, color: "#2563eb" },
              { label: "This Month", value: analytics?.sessions.thisMonth ?? 0, color: "#16a34a" },
              { label: "All Time", value: analytics?.sessions.allTime ?? 0, color: "#9333ea" },
            ].map((item) => {
              const pct = (analytics?.sessions.allTime ?? 0) > 0 ? Math.round((item.value / (analytics?.sessions.allTime ?? 1)) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{item.label}</span>
                    <span className="text-xs font-bold text-gray-900">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.max(pct, 2)}%`, background: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Message split */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Message Split</p>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-28 h-28">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke="#e85d04" strokeWidth="3"
                  strokeDasharray={`${((analytics?.messages.sent ?? 0) / Math.max(analytics?.messages.total ?? 1, 1)) * 97.4} 97.4`}
                  strokeLinecap="round" transform="rotate(-90 18 18)"
                />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke="#2563eb" strokeWidth="3"
                  strokeDasharray={`${((analytics?.messages.received ?? 0) / Math.max(analytics?.messages.total ?? 1, 1)) * 97.4} 97.4`}
                  strokeDashoffset={`-${((analytics?.messages.sent ?? 0) / Math.max(analytics?.messages.total ?? 1, 1)) * 97.4}`}
                  strokeLinecap="round" transform="rotate(-90 18 18)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-serif)" }}>
                  {analytics?.messages.total ?? 0}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#e85d04]" />
              <span className="text-gray-600">User ({analytics?.messages.sent ?? 0})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2563eb]" />
              <span className="text-gray-600">Bot ({analytics?.messages.received ?? 0})</span>
            </div>
          </div>
        </div>

        {/* Channel distribution placeholder */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Engagement Rate</p>
          <div className="text-center pt-4">
            <p className="text-4xl font-bold text-gray-900" style={{ fontFamily: "var(--font-serif)" }}>
              {analytics?.avgMessagesPerSession ? `${analytics.avgMessagesPerSession.toFixed(1)}` : "--"}
            </p>
            <p className="text-xs text-gray-400 mt-1">avg msgs per session</p>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Response rate</span>
              <span className="font-bold text-green-600">98%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Avg response time</span>
              <span className="font-bold text-gray-900">1.2s</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Resolution rate</span>
              <span className="font-bold text-blue-600">89%</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-gradient-to-br from-[#e85d04] to-[#c2410c] rounded-2xl p-5 shadow-sm text-white">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4">Highlights</p>
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                {analytics?.uniqueUsers ?? 0}
              </p>
              <p className="text-xs text-white/60 mt-0.5">Unique visitors</p>
            </div>
            <div>
              <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                {analytics?.sessions.today ?? 0}
              </p>
              <p className="text-xs text-white/60 mt-0.5">Sessions today</p>
            </div>
            <div>
              <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
                {analytics?.popularFirstMessages?.length ?? 0}
              </p>
              <p className="text-xs text-white/60 mt-0.5">Unique topics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart + Popular Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-8">
        {/* Activity by Hour */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <BarChart3 size={18} className="text-[#e85d04]" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
              >
                Activity by Hour
              </h2>
              <p className="text-xs text-gray-400">Message distribution across 24 hours</p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end gap-[3px] sm:gap-1.5 h-[180px] sm:h-[200px] px-1">
            {analytics?.mostActiveHours.map(({ hour, count }) => {
              const height = maxHourCount > 0 ? (count / maxHourCount) * 100 : 0;
              return (
                <div
                  key={hour}
                  className="flex-1 flex flex-col items-center justify-end group relative"
                  style={{ height: "100%" }}
                >
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {count} msgs
                  </div>
                  {/* Bar */}
                  <div
                    className="w-full rounded-t-[4px] sm:rounded-t-md transition-all duration-500 ease-out cursor-pointer"
                    style={{
                      height: `${Math.max(height, 2)}%`,
                      background: count > 0
                        ? `linear-gradient(to top, #e85d04, #f59e0b)`
                        : "#f3f4f6",
                      opacity: count > 0 ? 0.7 + (count / maxHourCount) * 0.3 : 0.4,
                    }}
                  />
                </div>
              );
            })}
          </div>
          {/* Hour Labels */}
          <div className="flex gap-[3px] sm:gap-1.5 mt-2 px-1">
            {analytics?.mostActiveHours.map(({ hour }) => (
              <div key={hour} className="flex-1 text-center">
                <span className="text-[8px] sm:text-[10px] text-gray-400 font-medium">
                  {hour % 3 === 0 ? formatHour(hour) : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Topics */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <MessageCircle size={18} className="text-blue-600" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
              >
                Popular Topics
              </h2>
              <p className="text-xs text-gray-400">Most common first messages</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {analytics?.popularFirstMessages && analytics.popularFirstMessages.length > 0 ? (
              analytics.popularFirstMessages.map((topic, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold ${
                      i < 3
                        ? "bg-[#e85d04] text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 flex-1 truncate leading-snug">
                    {topic.message}
                  </p>
                  <span className="flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-[#e85d04] border border-orange-100">
                    {topic.count}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No topic data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-6 sm:px-8 sm:py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Clock size={18} className="text-green-600" />
            </div>
            <div>
              <h2
                className="text-lg font-bold text-gray-900"
                style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
              >
                Recent Sessions
              </h2>
              <p className="text-xs text-gray-400">
                {pagination ? `${pagination.total} total sessions` : "Loading..."}
              </p>
            </div>
          </div>
        </div>

        {/* Table Header - Desktop */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 sm:px-8 py-3 bg-gray-50/80 border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
          <div className="col-span-3">User</div>
          <div className="col-span-3">First Message</div>
          <div className="col-span-1 text-center">Messages</div>
          <div className="col-span-2 text-center">Duration</div>
          <div className="col-span-2 text-right">Time</div>
          <div className="col-span-1 text-right">Status</div>
        </div>

        {/* Session Rows */}
        <div className="divide-y divide-gray-50">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-6 sm:px-8 py-4 hover:bg-gray-50/50 transition-colors items-center"
              >
                {/* User */}
                <div className="sm:col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Users size={14} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {session.externalUserId || `Session #${session.id.slice(-6)}`}
                    </p>
                    <p className="text-[11px] text-gray-400 sm:hidden">
                      {session.messageCount} msgs &middot; {timeAgo(session.startedAt)}
                    </p>
                  </div>
                </div>

                {/* First Message */}
                <div className="sm:col-span-3 min-w-0 hidden sm:block">
                  <p className="text-sm text-gray-600 truncate">
                    {session.firstUserMessage || "--"}
                  </p>
                </div>

                {/* Message Count */}
                <div className="sm:col-span-1 hidden sm:flex justify-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                    {session.messageCount}
                  </span>
                </div>

                {/* Duration */}
                <div className="sm:col-span-2 hidden sm:flex justify-center">
                  <span className="text-sm text-gray-500 font-medium">
                    {formatDuration(session.durationMs)}
                  </span>
                </div>

                {/* Time */}
                <div className="sm:col-span-2 hidden sm:block text-right">
                  <p className="text-sm text-gray-500">{timeAgo(session.startedAt)}</p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(session.startedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Status */}
                <div className="sm:col-span-1 hidden sm:flex justify-end">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      session.isActive
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {session.isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                    )}
                    {session.isActive ? "Active" : "Ended"}
                  </span>
                </div>

                {/* Mobile status badge */}
                <div className="sm:hidden flex items-center justify-between">
                  <p className="text-xs text-gray-500 truncate flex-1">
                    {session.firstUserMessage || "No message"}
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ml-2 ${
                      session.isActive
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {session.isActive ? "Active" : "Ended"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-8 py-12 text-center">
              <Users size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">No sessions recorded yet</p>
            </div>
          )}
        </div>

        {/* Load More */}
        {pagination?.hasMore && (
          <div className="px-6 sm:px-8 py-5 border-t border-gray-100 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm"
              style={{
                background: loadingMore ? "#f3f4f6" : "#e85d04",
                color: loadingMore ? "#9ca3af" : "white",
              }}
            >
              {loadingMore ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
