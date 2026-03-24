"use client";
import { useEffect, useState } from "react";
import { admin } from "@/lib/api";
import { Save, Loader2, Check } from "lucide-react";

export default function BotConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    admin.getBotConfig().then(setConfig).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await admin.updateBotConfig({
        name: config.name, systemPrompt: config.systemPrompt, personality: config.personality,
        welcomeMessage: config.welcomeMessage, model: config.model, maxTokens: config.maxTokens,
      });
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  if (!config) return <div className="text-[rgba(0,0,0,0.4)]">Loading...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1B1C15]">Bot Configuration</h1>
          <p className="text-[rgba(0,0,0,0.5)] mt-1 text-[15px]">Customize your AI assistant&apos;s behavior</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-premium">
          {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <Save size={18} />}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="premium-card p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          <div>
            <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Bot Name</label>
            <input type="text" value={config.name} onChange={(e) => setConfig({ ...config, name: e.target.value })} className="premium-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Personality</label>
            <select value={config.personality} onChange={(e) => setConfig({ ...config, personality: e.target.value })} className="premium-input">
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">AI Model</label>
            <select value={config.model} onChange={(e) => setConfig({ ...config, model: e.target.value })} className="premium-input">
              <option value="MiniMax-M2.7-highspeed">MiniMax M2.7 Highspeed (Default)</option>
              <option value="MiniMax-M2.5">MiniMax M2.5 (Best)</option>
              <option value="MiniMax-M2.5-lightning">MiniMax M2.5 Lightning</option>
              <option value="MiniMax-M2">MiniMax M2 (Agentic)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Max Tokens</label>
            <input type="number" value={config.maxTokens} onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })} className="premium-input" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">System Prompt</label>
          <textarea value={config.systemPrompt} onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })} rows={8} className="premium-input font-mono text-sm" />
          <p className="text-[11px] text-[rgba(0,0,0,0.35)] mt-2">Define your AI&apos;s role, capabilities, and behavior.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Welcome Message</label>
          <textarea value={config.welcomeMessage} onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })} rows={3} className="premium-input" />
          <p className="text-[11px] text-[rgba(0,0,0,0.35)] mt-2">First message users see when they open the chat widget.</p>
        </div>
      </div>
    </div>
  );
}
