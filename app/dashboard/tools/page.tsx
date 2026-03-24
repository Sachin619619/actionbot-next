"use client";

import { useEffect, useState } from "react";
import { admin } from "@/lib/api";
import { Plus, Trash2, Edit2, Shield, X, Wrench } from "lucide-react";

interface ToolForm {
  name: string;
  description: string;
  endpointUrl: string;
  httpMethod: string;
  isSensitive: boolean;
  timeoutSeconds: number;
  params: Array<{ name: string; type: string; description: string; required: boolean }>;
}

const emptyForm: ToolForm = {
  name: "",
  description: "",
  endpointUrl: "",
  httpMethod: "POST",
  isSensitive: false,
  timeoutSeconds: 30,
  params: [],
};

export default function ToolsPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ToolForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { loadTools(); }, []);
  const loadTools = () => admin.getTools().then(setTools).catch(console.error);

  const buildSchema = (params: ToolForm["params"]) => {
    const properties: any = {};
    const required: string[] = [];
    for (const p of params) {
      properties[p.name] = { type: p.type, description: p.description };
      if (p.required) required.push(p.name);
    }
    return { type: "object", properties, ...(required.length > 0 ? { required } : {}) };
  };

  const handleSave = async () => {
    const data = {
      name: form.name, description: form.description,
      inputSchema: buildSchema(form.params), endpointUrl: form.endpointUrl,
      httpMethod: form.httpMethod, isSensitive: form.isSensitive, timeoutSeconds: form.timeoutSeconds,
    };
    if (editId) await admin.updateTool(editId, data);
    else await admin.createTool(data);
    setShowModal(false); setForm(emptyForm); setEditId(null); loadTools();
  };

  const handleEdit = (tool: any) => {
    const schema = tool.inputSchema || {};
    const props = schema.properties || {};
    const req = schema.required || [];
    const params = Object.entries(props).map(([name, val]: [string, any]) => ({
      name, type: val.type || "string", description: val.description || "", required: req.includes(name),
    }));
    setForm({ name: tool.name, description: tool.description, endpointUrl: tool.endpointUrl, httpMethod: tool.httpMethod, isSensitive: tool.isSensitive, timeoutSeconds: tool.timeoutSeconds, params });
    setEditId(tool.id); setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tool?")) return;
    await admin.deleteTool(id); loadTools();
  };

  const addParam = () => setForm({ ...form, params: [...form.params, { name: "", type: "string", description: "", required: false }] });
  const removeParam = (i: number) => setForm({ ...form, params: form.params.filter((_, idx) => idx !== i) });
  const updateParam = (i: number, field: string, value: any) => {
    const params = [...form.params];
    (params[i] as any)[field] = value;
    setForm({ ...form, params });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1B1C15]">Tools</h1>
          <p className="text-[rgba(0,0,0,0.5)] mt-1 text-[15px]">API endpoints your AI can call</p>
        </div>
        <button onClick={() => { setForm(emptyForm); setEditId(null); setShowModal(true); }} className="btn-premium">
          <Plus size={18} /> Add Tool
        </button>
      </div>

      {tools.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <div className="w-16 h-16 bg-[#f5eed8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wrench size={28} className="text-[#1B1C15]/30" />
          </div>
          <p className="text-[rgba(0,0,0,0.5)] text-[15px]">No tools yet. Add your first tool to give your AI superpowers!</p>
        </div>
      ) : (
        <div className="grid gap-4 stagger-children">
          {tools.map((tool) => (
            <div key={tool.id} className="premium-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-[17px] font-serif font-bold text-[#1B1C15]">{tool.name}</h3>
                    {tool.isSensitive && <span className="pill pill-warning text-[11px] gap-1"><Shield size={11} /> Sensitive</span>}
                    <span className={`pill text-[11px] ${tool.isActive ? "pill-success" : ""}`}>{tool.isActive ? "Active" : "Inactive"}</span>
                  </div>
                  <p className="text-sm text-[rgba(0,0,0,0.5)] mb-3">{tool.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="pill text-[11px]">{tool.httpMethod}</span>
                    <span className="pill text-[11px] font-mono truncate max-w-[280px] sm:max-w-none">{tool.endpointUrl}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(tool)} className="p-2.5 rounded-xl text-[#1B1C15]/40 hover:text-[#1B1C15] hover:bg-[#f5eed8] transition-all"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(tool.id)} className="p-2.5 rounded-xl text-[#1B1C15]/40 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 modal-overlay flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="premium-card w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-[20px] animate-slide-up">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[rgba(0,0,0,0.06)]">
              <h2 className="text-lg font-serif font-bold text-[#1B1C15]">{editId ? "Edit Tool" : "Add New Tool"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#f5eed8] rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Tool Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="premium-input" placeholder="search_products" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">HTTP Method</label>
                  <select value={form.httpMethod} onChange={(e) => setForm({ ...form, httpMethod: e.target.value })} className="premium-input">
                    <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="premium-input" rows={2} placeholder="What does this tool do?" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Endpoint URL</label>
                <input value={form.endpointUrl} onChange={(e) => setForm({ ...form, endpointUrl: e.target.value })} className="premium-input font-mono text-sm" placeholder="https://api.yourservice.com/search" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isSensitive} onChange={(e) => setForm({ ...form, isSensitive: e.target.checked })} className="w-5 h-5 accent-[#1B1C15] rounded" />
                  <span className="text-sm text-[#1B1C15]">Sensitive (requires confirmation)</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-[#1B1C15]/60">Timeout:</label>
                  <input type="number" value={form.timeoutSeconds} onChange={(e) => setForm({ ...form, timeoutSeconds: parseInt(e.target.value) })} className="w-20 premium-input text-center !py-2 !px-2" />
                  <span className="text-sm text-[rgba(0,0,0,0.35)]">sec</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider">Input Parameters</label>
                  <button onClick={addParam} className="text-sm text-[#1B1C15] font-semibold hover:opacity-60 transition-opacity">+ Add Parameter</button>
                </div>
                {form.params.length === 0 ? (
                  <p className="text-sm text-[rgba(0,0,0,0.35)] italic">No parameters defined yet.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="hidden sm:grid grid-cols-[1fr_100px_1fr_70px_40px] gap-2 text-[11px] text-[rgba(0,0,0,0.4)] font-semibold uppercase tracking-wider px-1">
                      <span>Name</span><span>Type</span><span>Description</span><span>Required</span><span></span>
                    </div>
                    {form.params.map((p, i) => (
                      <div key={i} className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-[1fr_100px_1fr_70px_40px] gap-2 items-center bg-[#FFFAEB] sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                        <input value={p.name} onChange={(e) => updateParam(i, "name", e.target.value)} className="premium-input !py-2 text-sm" placeholder="param_name" />
                        <select value={p.type} onChange={(e) => updateParam(i, "type", e.target.value)} className="premium-input !py-2 text-sm">
                          <option value="string">string</option><option value="number">number</option><option value="boolean">boolean</option><option value="array">array</option>
                        </select>
                        <input value={p.description} onChange={(e) => updateParam(i, "description", e.target.value)} className="premium-input !py-2 text-sm" placeholder="Description..." />
                        <label className="flex items-center gap-2 sm:justify-center cursor-pointer">
                          <input type="checkbox" checked={p.required} onChange={(e) => updateParam(i, "required", e.target.checked)} className="w-4 h-4 accent-[#1B1C15]" />
                          <span className="sm:hidden text-xs text-[rgba(0,0,0,0.5)]">Required</span>
                        </label>
                        <button onClick={() => removeParam(i)} className="p-1.5 text-[rgba(0,0,0,0.3)] hover:text-red-500 transition-colors"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 sm:p-6 border-t border-[rgba(0,0,0,0.06)]">
              <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-premium">{editId ? "Update Tool" : "Create Tool"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
