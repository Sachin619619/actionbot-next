"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { admin } from "@/lib/api";
import {
  MessageSquare, Search, Filter, ChevronLeft, ChevronRight,
  User, Clock, Hash, ArrowUpRight,
} from "lucide-react";

function formatDuration(ms: number): string {
  if (ms < 1000) return "< 1s";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await admin.getSessions({ page, limit: 20, search: search || undefined, status: statusFilter });
      setSessions(data.sessions || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleStatusChange = (s: string) => {
    setStatusFilter(s);
    setPage(1);
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl sm:text-3xl font-bold text-gray-900"
          style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
        >
          Chat Sessions
        </h1>
        <p className="text-gray-500 mt-1 text-[15px]">
          Monitor and review all conversations with your users
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user ID, session ID, or message content..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#e85d04]/20 focus:border-[#e85d04] transition-all bg-gray-50/50"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400 hidden sm:block" />
            {["all", "active", "ended"].map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  statusFilter === s
                    ? "bg-[#e85d04] text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      {pagination && (
        <p className="text-xs text-gray-400 mb-4 font-medium">
          Showing {sessions.length} of {pagination.total} sessions
          {search && <span> matching &quot;{search}&quot;</span>}
        </p>
      )}

      {/* Sessions Table - Desktop */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-8 h-8 border-2 border-[#e85d04] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-500 text-[15px] font-medium mb-1">No sessions found</p>
          <p className="text-gray-400 text-sm">
            {search ? "Try a different search query" : "Sessions will appear once users start chatting"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">User</th>
                  <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Messages</th>
                  <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Started</th>
                  <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Duration</th>
                  <th className="text-left px-6 py-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((s: any) => (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/dashboard/sessions/${s.id}`)}
                    className="border-b border-gray-50 last:border-0 hover:bg-orange-50/30 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <User size={15} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {s.externalUserId || "Anonymous"}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono">{s.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Hash size={12} className="text-gray-300" />
                        <span className="text-sm font-semibold text-gray-700">{s.messageCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-700">{formatDate(s.startedAt)}</p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(s.startedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-gray-300" />
                        <span className="text-sm text-gray-600">{formatDuration(s.durationMs)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          s.status === "active"
                            ? "bg-green-50 text-green-600 border border-green-100"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {s.status === "active" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                        )}
                        {s.status === "active" ? "Active" : "Ended"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ArrowUpRight
                        size={16}
                        className="text-gray-300 group-hover:text-[#e85d04] transition-colors"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {sessions.map((s: any) => (
              <div
                key={s.id}
                onClick={() => router.push(`/dashboard/sessions/${s.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                      <User size={15} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.externalUserId || "Anonymous"}</p>
                      <p className="text-[11px] text-gray-400 font-mono">{s.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      s.status === "active"
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {s.status === "active" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                    )}
                    {s.status === "active" ? "Active" : "Ended"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Hash size={11} />{s.messageCount} msgs</span>
                  <span className="flex items-center gap-1"><Clock size={11} />{formatDuration(s.durationMs)}</span>
                  <span className="ml-auto">{formatDate(s.startedAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasMore}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
