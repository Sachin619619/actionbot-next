"use client";
import { useEffect, useState } from "react";
import { admin } from "@/lib/api";
import { MessageSquare, Wrench, Users, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    admin.stats().then(setStats).catch(console.error);
  }, []);

  const cards = [
    { label: "Chat Sessions", value: stats?.sessionCount ?? "-", icon: Users, bg: "bg-blue-50", iconColor: "text-blue-600" },
    { label: "Total Messages", value: stats?.messageCount ?? "-", icon: MessageSquare, bg: "bg-green-50", iconColor: "text-green-600" },
    { label: "Total Tools", value: stats?.toolCount ?? "-", icon: Wrench, bg: "bg-amber-50", iconColor: "text-amber-600" },
    { label: "Active Tools", value: stats?.activeTools ?? "-", icon: Activity, bg: "bg-purple-50", iconColor: "text-purple-600" },
  ];

  const steps = [
    { step: "01", title: "Configure your bot", desc: "Set up personality, system prompt, and AI model", link: "/dashboard/bot" },
    { step: "02", title: "Add tools", desc: "Connect API endpoints your bot can call", link: "/dashboard/tools" },
    { step: "03", title: "Build knowledge", desc: "Add FAQs, policies, and business info", link: "/dashboard/knowledge" },
    { step: "04", title: "Embed widget", desc: "Get your code snippet and go live", link: "/dashboard/widget" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1B1C15]">Dashboard</h1>
        <p className="text-[rgba(0,0,0,0.5)] mt-1 text-[15px]">Your AI action bot at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 stagger-children">
        {cards.map(({ label, value, icon: Icon, bg, iconColor }) => (
          <div key={label} className="premium-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-[rgba(0,0,0,0.4)] uppercase tracking-wider">{label}</span>
              <div className={`${bg} p-2.5 rounded-xl`}><Icon size={18} className={iconColor} /></div>
            </div>
            <p className="text-3xl sm:text-4xl font-serif font-bold text-[#1B1C15]">{value}</p>
          </div>
        ))}
      </div>

      <div className="premium-card p-6 sm:p-8">
        <h2 className="text-xl font-serif font-bold text-[#1B1C15] mb-2">Getting Started</h2>
        <p className="text-sm text-[rgba(0,0,0,0.5)] mb-6">Follow these steps to set up your AI action bot</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {steps.map(({ step, title, desc, link }) => (
            <Link key={step} href={link} className="group p-5 rounded-2xl bg-[#FFFAEB] border border-[rgba(0,0,0,0.06)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <span className="text-xs font-bold text-[rgba(0,0,0,0.25)] uppercase tracking-widest">{step}</span>
              <h3 className="text-[15px] font-bold text-[#1B1C15] mt-3 mb-1 group-hover:opacity-70 transition-opacity">{title}</h3>
              <p className="text-[13px] text-[rgba(0,0,0,0.5)] leading-relaxed">{desc}</p>
              <ArrowRight size={16} className="mt-3 text-[#1B1C15]/30 group-hover:text-[#1B1C15] group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
