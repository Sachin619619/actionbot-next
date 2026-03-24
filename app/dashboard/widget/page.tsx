"use client";

import { useEffect, useState } from "react";
import { admin } from "@/lib/api";
import { Copy, Check, Code, Key } from "lucide-react";

export default function WidgetPage() {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { admin.getWidgetCode().then(setData).catch(console.error); }, []);

  const copyCode = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return <div className="text-[rgba(0,0,0,0.4)]">Loading...</div>;

  return (
    <div className="overflow-hidden">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1B1C15]">Chat Widget</h1>
        <p className="text-[rgba(0,0,0,0.5)] mt-1 text-[15px]">Embed your AI assistant anywhere</p>
      </div>
      <div className="grid gap-5 max-w-2xl stagger-children">
        <div className="premium-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-[#f5eed8] rounded-xl flex items-center justify-center"><Key size={16} className="text-[#1B1C15]/60" /></div>
            <div>
              <h2 className="text-[17px] font-serif font-bold text-[#1B1C15]">Your API Key</h2>
              <p className="text-[11px] text-[rgba(0,0,0,0.4)]">For widget and API authentication</p>
            </div>
          </div>
          <div className="bg-[#FFFAEB] p-4 rounded-xl font-mono text-sm text-[#1B1C15] break-all border border-[rgba(0,0,0,0.06)]">{data.apiKey}</div>
        </div>
        <div className="premium-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#f5eed8] rounded-xl flex items-center justify-center"><Code size={16} className="text-[#1B1C15]/60" /></div>
              <div>
                <h2 className="text-[17px] font-serif font-bold text-[#1B1C15]">Embed Code</h2>
                <p className="text-[11px] text-[rgba(0,0,0,0.4)]">Add before closing &lt;/body&gt; tag</p>
              </div>
            </div>
            <button onClick={copyCode} className="btn-secondary flex items-center gap-2 !py-2 !px-4 text-[13px]">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="bg-[#1B1C15] text-[#a8d08d] p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap break-all overflow-hidden">{data.embedCode}</pre>
        </div>
        <div className="premium-card p-5 sm:p-6">
          <h2 className="text-[17px] font-serif font-bold text-[#1B1C15] mb-2">Preview</h2>
          <p className="text-sm text-[rgba(0,0,0,0.4)] mb-4">How the chat widget appears on your site</p>
          <div className="bg-[#f5eed8] rounded-2xl p-8 relative h-72 sm:h-80 overflow-hidden border border-[rgba(0,0,0,0.06)]">
            <div className="text-center text-[rgba(0,0,0,0.25)] mt-10">
              <Code size={40} className="mx-auto mb-3" />
              <p className="text-[15px]">Your website content here</p>
            </div>
            <div className="absolute bottom-4 right-4 w-14 h-14 rounded-2xl bg-[#1B1C15] flex items-center justify-center text-white text-2xl shadow-lg cursor-pointer hover:scale-110 hover:-translate-y-1 transition-all duration-300">💬</div>
          </div>
        </div>
        <div className="bg-[#FFFAEB] rounded-[20px] p-5 sm:p-6 border border-[rgba(0,0,0,0.06)]">
          <h3 className="font-serif font-bold text-[#1B1C15] mb-3 text-[17px]">Integration Guide</h3>
          <ol className="text-sm text-[#1B1C15]/70 space-y-3 list-decimal list-inside leading-relaxed">
            <li>Copy the embed code above</li>
            <li>Paste it in your HTML before <code className="bg-white/60 px-2 py-0.5 rounded-lg text-[13px] font-mono">&lt;/body&gt;</code></li>
            <li>The chat bubble will appear in the bottom-right corner</li>
            <li>Your AI assistant will respond using your tools and knowledge</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
