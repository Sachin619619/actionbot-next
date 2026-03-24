"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";
import {
  LayoutDashboard, Bot, Wrench, BookOpen,
  MessageSquare, Code, LogOut, Menu, X,
} from "lucide-react";

const NAV = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/dashboard/bot", label: "Bot Config", icon: Bot },
  { path: "/dashboard/tools", label: "Tools", icon: Wrench },
  { path: "/dashboard/knowledge", label: "Knowledge", icon: BookOpen },
  { path: "/dashboard/sessions", label: "Chat Logs", icon: MessageSquare },
  { path: "/dashboard/widget", label: "Widget", icon: Code },
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
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#f5eed8] rounded-xl flex items-center justify-center text-xl">
            🤖
          </div>
          <div>
            <h1 className="text-[17px] font-serif font-bold text-[#1B1C15] tracking-tight">ActionBot</h1>
            <p className="text-[11px] text-[rgba(0,0,0,0.4)] uppercase tracking-widest font-medium">AI Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = pathname === path;
          return (
            <Link
              key={path}
              href={path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-200 ${
                active
                  ? "bg-[#1B1C15] text-white shadow-md shadow-black/20"
                  : "text-[#1B1C15]/70 hover:bg-[#f5eed8] hover:text-[#1B1C15]"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 mt-auto">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] font-medium text-[#1B1C15]/50 hover:bg-red-50 hover:text-red-600 w-full transition-all duration-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#F4EDD9]">
      <aside className="hidden md:flex w-[260px] flex-col bg-white/80 backdrop-blur-xl border-r border-[#e8e0cc]/60 flex-shrink-0">
        <NavContent />
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-white/95 backdrop-blur-xl border-r border-[#e8e0cc]/60 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="absolute top-4 right-4">
          <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-[#f5eed8] transition-colors">
            <X size={20} />
          </button>
        </div>
        <NavContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[rgba(244,237,217,0.8)] backdrop-blur-[11px] border-b border-[#e8e0cc]/60 flex-shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl hover:bg-white/50 transition-colors">
            <Menu size={22} className="text-[#1B1C15]" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="font-serif font-bold text-[15px] text-[#1B1C15]">ActionBot</span>
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="animate-fade-in-up">{children}</div>
        </main>
      </div>
    </div>
  );
}
