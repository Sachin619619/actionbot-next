"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";
import {
  LayoutDashboard, Bot, Wrench, BookOpen,
  MessageSquare, Code, LogOut, Menu, X,
  BarChart3, Settings,
} from "lucide-react";

const NAV = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/dashboard/bot", label: "Bot Config", icon: Bot },
  { path: "/dashboard/tools", label: "Tools", icon: Wrench },
  { path: "/dashboard/knowledge", label: "Knowledge", icon: BookOpen },
  { path: "/dashboard/sessions", label: "Chat Logs", icon: MessageSquare },
  { path: "/dashboard/widget", label: "Widget", icon: Code },
];

const BOTTOM_NAV = [
  { path: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => {
    clearToken();
    router.push("/login");
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 pt-6 pb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e85d04] flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-white tracking-tight" style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>
              ActionBot
            </h1>
            <p className="text-[11px] text-white/40 uppercase tracking-widest font-medium">AI Platform</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-1">
        <p className="px-4 mb-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">Menu</p>
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              href={path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                active
                  ? "bg-[#e85d04] text-white shadow-lg shadow-[#e85d04]/25"
                  : "text-white/60 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        <div className="my-4 mx-4 border-t border-white/10" />
        <p className="px-4 mb-2 text-[10px] font-semibold text-white/30 uppercase tracking-widest">System</p>
        {BOTTOM_NAV.map(({ path, label, icon: Icon }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              href={path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                active
                  ? "bg-[#e85d04] text-white shadow-lg shadow-[#e85d04]/25"
                  : "text-white/60 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 mt-auto border-t border-white/10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium text-white/40 hover:bg-red-500/15 hover:text-red-400 w-full transition-all duration-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#f8f9fa]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] flex-col flex-shrink-0" style={{ background: "#1a1a1a" }}>
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "#1a1a1a" }}
      >
        <div className="absolute top-4 right-4">
          <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X size={20} className="text-white/60" />
          </button>
        </div>
        <NavContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <Menu size={22} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#e85d04] flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <span className="font-bold text-[15px] text-gray-900" style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>ActionBot</span>
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8f9fa]">
          <div className="animate-fade-in-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
