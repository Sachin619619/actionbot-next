"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Search, User, MessageSquare, Clock, Calendar,
  ChevronRight, ArrowUpDown, Mail, Hash, Activity,
} from "lucide-react";

function request(path: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("actionbot_token") : null;
  return fetch(`/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).then((r) => r.json());
}

function timeAgo(date: string | Date): string {
  const now = Date.now();
  const d = new Date(date).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ContactsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"lastSeen" | "sessions" | "messages">("lastSeen");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    request("/admin/contacts")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const contacts = data?.contacts || [];
  const filtered = contacts.filter((c: any) =>
    c.userId.toLowerCase().includes(search.toLowerCase()) ||
    (c.metadata?.authenticatedEmail || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.metadata?.authenticatedName || "").toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a: any, b: any) => {
    if (sortBy === "sessions") return b.sessionCount - a.sessionCount;
    if (sortBy === "messages") return b.totalMessages - a.totalMessages;
    return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
  });

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="w-8 h-8 border-2 border-[#e85d04] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-bold text-gray-900"
              style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}
            >
              Contacts
            </h1>
            <p className="text-gray-500 text-[15px]">Users who have chatted with your bot</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{data?.total || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Identified</p>
          <p className="text-2xl font-bold text-gray-900">
            {contacts.filter((c: any) => c.userId !== "anonymous").length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Avg Sessions</p>
          <p className="text-2xl font-bold text-gray-900">
            {contacts.length > 0
              ? (contacts.reduce((sum: number, c: any) => sum + c.sessionCount, 0) / contacts.length).toFixed(1)
              : "0"}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Active Today</p>
          <p className="text-2xl font-bold text-gray-900">
            {contacts.filter((c: any) => {
              const last = new Date(c.lastSeen).getTime();
              return Date.now() - last < 24 * 60 * 60 * 1000;
            }).length}
          </p>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user ID, email, or name..."
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none text-gray-700"
            >
              <option value="lastSeen">Last Active</option>
              <option value="sessions">Most Sessions</option>
              <option value="messages">Most Messages</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <Users size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium mb-1">No contacts yet</p>
            <p className="text-sm text-gray-400">Users will appear here once they start chatting with your bot</p>
          </div>
        ) : (
          sorted.map((contact: any) => {
            const isExpanded = expanded === contact.userId;
            const isAnon = contact.userId === "anonymous";
            const email = contact.metadata?.authenticatedEmail;
            const name = contact.metadata?.authenticatedName;
            const isActive = Date.now() - new Date(contact.lastSeen).getTime() < 30 * 60 * 1000;

            return (
              <div
                key={contact.userId}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Contact Row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : contact.userId)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isAnon
                        ? "bg-gray-100 text-gray-400"
                        : "bg-gradient-to-br from-[#e85d04] to-orange-600 text-white"
                    }`}
                  >
                    {isAnon ? (
                      <User size={16} />
                    ) : (
                      <span className="text-sm font-bold">
                        {(name || contact.userId || "?")[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {name || (isAnon ? "Anonymous User" : contact.userId)}
                      </p>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                      )}
                    </div>
                    {email && (
                      <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                        <Mail size={10} /> {email}
                      </p>
                    )}
                    {!email && !isAnon && (
                      <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                        <Hash size={10} /> {contact.userId}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-xs text-gray-500">
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-sm">{contact.sessionCount}</p>
                      <p className="text-gray-400">sessions</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-sm">{contact.totalMessages}</p>
                      <p className="text-gray-400">messages</p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="text-gray-600 font-medium">{timeAgo(contact.lastSeen)}</p>
                      <p className="text-gray-400">last active</p>
                    </div>
                  </div>

                  <ChevronRight
                    size={16}
                    className={`text-gray-300 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                </button>

                {/* Expanded Sessions */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                    {/* Mobile stats */}
                    <div className="sm:hidden flex items-center gap-4 mb-4 text-xs">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Activity size={12} /> {contact.sessionCount} sessions
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <MessageSquare size={12} /> {contact.totalMessages} messages
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Clock size={12} /> {timeAgo(contact.lastSeen)}
                      </span>
                    </div>

                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      Session History
                    </p>
                    <div className="space-y-2">
                      {contact.sessions.slice(0, 10).map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => router.push(`/dashboard/sessions/${s.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-left"
                        >
                          <MessageSquare size={14} className="text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-gray-500 truncate">{s.id}</p>
                          </div>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MessageSquare size={10} /> {s.messageCount}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={10} />{" "}
                            {new Date(s.startedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <ChevronRight size={12} className="text-gray-300" />
                        </button>
                      ))}
                      {contact.sessions.length > 10 && (
                        <p className="text-xs text-gray-400 text-center py-2">
                          +{contact.sessions.length - 10} more sessions
                        </p>
                      )}
                    </div>

                    {/* First/Last Seen */}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                      <p className="text-[11px] text-gray-400">
                        First seen:{" "}
                        <span className="font-medium text-gray-500">
                          {new Date(contact.firstSeen).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Last seen:{" "}
                        <span className="font-medium text-gray-500">
                          {new Date(contact.lastSeen).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
