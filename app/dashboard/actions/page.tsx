"use client";

import { useEffect, useState } from "react";
import { actions } from "@/lib/api";
import { Plus, Trash2, Edit2, X, Zap, Play, Check, AlertCircle, ExternalLink } from "lucide-react";

interface HeaderEntry {
  key: string;
  value: string;
}

interface ActionForm {
  name: string;
  description: string;
  webhookUrl: string;
  headers: HeaderEntry[];
  bodyTemplate: string;
  enabled: boolean;
}

const emptyForm: ActionForm = {
  name: "",
  description: "",
  webhookUrl: "",
  headers: [],
  bodyTemplate: "",
  enabled: true,
};

export default function ActionsPage() {
  const [actionsList, setActionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ActionForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ status: number; body: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = () => {
    setLoading(true);
    actions
      .list()
      .then(setActionsList)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleSave = async () => {
    if (!form.name || !form.description || !form.webhookUrl) return;
    setSaving(true);
    try {
      const headersObj: Record<string, string> = {};
      form.headers.forEach((h) => {
        if (h.key.trim()) headersObj[h.key.trim()] = h.value;
      });

      let bodyTemplate = null;
      if (form.bodyTemplate.trim()) {
        try {
          bodyTemplate = JSON.parse(form.bodyTemplate);
        } catch {
          bodyTemplate = form.bodyTemplate;
        }
      }

      const data = {
        name: form.name,
        description: form.description,
        webhookUrl: form.webhookUrl,
        headers: Object.keys(headersObj).length > 0 ? headersObj : null,
        bodyTemplate,
        enabled: form.enabled,
      };

      if (editId) await actions.update(editId, data);
      else await actions.create(data);

      setShowModal(false);
      setForm(emptyForm);
      setEditId(null);
      setTestResult(null);
      setTestError(null);
      loadActions();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (action: any) => {
    const headers: HeaderEntry[] = [];
    if (action.headers && typeof action.headers === "object") {
      Object.entries(action.headers).forEach(([key, value]) => {
        headers.push({ key, value: String(value) });
      });
    }

    setForm({
      name: action.name,
      description: action.description,
      webhookUrl: action.webhookUrl,
      headers,
      bodyTemplate: action.bodyTemplate ? JSON.stringify(action.bodyTemplate, null, 2) : "",
      enabled: action.enabled,
    });
    setEditId(action.id);
    setTestResult(null);
    setTestError(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this action? This cannot be undone.")) return;
    await actions.delete(id);
    loadActions();
  };

  const handleToggle = async (action: any) => {
    await actions.update(action.id, { enabled: !action.enabled });
    loadActions();
  };

  const handleTest = async () => {
    if (!form.webhookUrl) return;
    setTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      const headersObj: Record<string, string> = {
        "Content-Type": "application/json",
      };
      form.headers.forEach((h) => {
        if (h.key.trim()) headersObj[h.key.trim()] = h.value;
      });

      let body: string | undefined;
      if (form.bodyTemplate.trim()) {
        body = form.bodyTemplate;
      } else {
        body = JSON.stringify({ test: true, source: "actionbot", timestamp: new Date().toISOString() });
      }

      const res = await fetch(form.webhookUrl, {
        method: "POST",
        headers: headersObj,
        body,
      });

      const text = await res.text();
      setTestResult({ status: res.status, body: text.slice(0, 2000) });
    } catch (err: any) {
      setTestError(err.message || "Failed to reach webhook");
    } finally {
      setTesting(false);
    }
  };

  const addHeader = () => setForm({ ...form, headers: [...form.headers, { key: "", value: "" }] });
  const removeHeader = (i: number) => setForm({ ...form, headers: form.headers.filter((_, idx) => idx !== i) });
  const updateHeader = (i: number, field: "key" | "value", val: string) => {
    const headers = [...form.headers];
    headers[i][field] = val;
    setForm({ ...form, headers });
  };

  const truncateUrl = (url: string, max = 45) => (url.length > max ? url.slice(0, max) + "..." : url);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1B1C15]">Actions & Webhooks</h1>
          <p className="text-[rgba(0,0,0,0.5)] mt-1 text-[15px]">
            Configure webhook actions your AI can trigger during conversations
          </p>
        </div>
        <button
          onClick={() => {
            setForm(emptyForm);
            setEditId(null);
            setTestResult(null);
            setTestError(null);
            setShowModal(true);
          }}
          className="btn-premium"
        >
          <Plus size={18} /> New Action
        </button>
      </div>

      {/* Actions List */}
      {loading ? (
        <div className="premium-card p-12 text-center">
          <div className="w-8 h-8 border-2 border-[#e85d04] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : actionsList.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#e85d04]/10 to-[#e85d04]/5 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Zap size={36} className="text-[#e85d04]/40" />
          </div>
          <h3 className="text-lg font-serif font-bold text-[#1B1C15] mb-2">No actions configured yet</h3>
          <p className="text-[rgba(0,0,0,0.45)] text-[15px] mb-6 max-w-md mx-auto">
            Actions let your AI trigger webhooks during conversations — create orders, send notifications, update records, and more.
          </p>
          <button
            onClick={() => {
              setForm(emptyForm);
              setEditId(null);
              setShowModal(true);
            }}
            className="btn-premium"
          >
            <Plus size={18} /> Create your first action
          </button>
        </div>
      ) : (
        <div className="grid gap-4 stagger-children">
          {actionsList.map((action) => (
            <div key={action.id} className="premium-card p-5 sm:p-6 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${action.enabled ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-gray-300"}`} />
                    <h3 className="text-[17px] font-serif font-bold text-[#1B1C15]">{action.name}</h3>
                    <span className={`pill text-[11px] ${action.enabled ? "pill-success" : ""}`}>
                      {action.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-sm text-[rgba(0,0,0,0.5)] mb-3">{action.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="pill text-[11px]">POST</span>
                    <span className="pill text-[11px] font-mono truncate max-w-[280px] sm:max-w-none flex items-center gap-1.5">
                      <ExternalLink size={10} className="flex-shrink-0 opacity-40" />
                      {truncateUrl(action.webhookUrl)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggle(action)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${action.enabled ? "bg-emerald-500" : "bg-gray-300"}`}
                    title={action.enabled ? "Disable action" : "Enable action"}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${action.enabled ? "translate-x-[22px]" : "translate-x-0.5"}`}
                    />
                  </button>
                  <button
                    onClick={() => handleEdit(action)}
                    className="p-2.5 rounded-xl text-[#1B1C15]/40 hover:text-[#1B1C15] hover:bg-[#f5eed8] transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(action.id)}
                    className="p-2.5 rounded-xl text-[#1B1C15]/40 hover:text-red-600 hover:bg-red-50 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 modal-overlay flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="premium-card w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-[20px] animate-slide-up">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[rgba(0,0,0,0.06)]">
              <h2 className="text-lg font-serif font-bold text-[#1B1C15]">
                {editId ? "Edit Action" : "Create New Action"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setTestResult(null);
                  setTestError(null);
                }}
                className="p-2 hover:bg-[#f5eed8] rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">
                  Action Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="premium-input"
                  placeholder="create_order"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">
                  Description
                </label>
                <p className="text-[11px] text-[rgba(0,0,0,0.35)] mb-1.5">
                  This is what the AI sees to decide when to use this action
                </p>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="premium-input"
                  rows={3}
                  placeholder="Creates a new order with the given product and quantity. Use when a customer wants to place an order."
                />
              </div>

              {/* Webhook URL */}
              <div>
                <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">
                  Webhook URL
                </label>
                <input
                  value={form.webhookUrl}
                  onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                  className="premium-input font-mono text-sm"
                  placeholder="https://api.yourservice.com/webhook"
                  type="url"
                />
              </div>

              {/* Headers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider">
                    Headers
                  </label>
                  <button onClick={addHeader} className="text-sm text-[#e85d04] font-semibold hover:opacity-70 transition-opacity">
                    + Add Header
                  </button>
                </div>
                {form.headers.length === 0 ? (
                  <p className="text-sm text-[rgba(0,0,0,0.3)] italic">No custom headers.</p>
                ) : (
                  <div className="space-y-2">
                    {form.headers.map((h, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={h.key}
                          onChange={(e) => updateHeader(i, "key", e.target.value)}
                          className="premium-input !py-2 text-sm flex-1"
                          placeholder="Header name"
                        />
                        <input
                          value={h.value}
                          onChange={(e) => updateHeader(i, "value", e.target.value)}
                          className="premium-input !py-2 text-sm flex-1"
                          placeholder="Value"
                        />
                        <button
                          onClick={() => removeHeader(i)}
                          className="p-1.5 text-[rgba(0,0,0,0.3)] hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Body Template */}
              <div>
                <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">
                  Body Template
                </label>
                <p className="text-[11px] text-[rgba(0,0,0,0.35)] mb-1.5">
                  Use <code className="bg-[#f5eed8] px-1.5 py-0.5 rounded text-[#e85d04] font-mono text-[10px]">{"{{placeholder}}"}</code> for dynamic values the AI will fill in
                </p>
                <textarea
                  value={form.bodyTemplate}
                  onChange={(e) => setForm({ ...form, bodyTemplate: e.target.value })}
                  className="premium-input font-mono text-sm leading-relaxed"
                  rows={6}
                  placeholder={`{\n  "product": "{{product_name}}",\n  "quantity": {{quantity}},\n  "customer_email": "{{email}}"\n}`}
                  style={{ tabSize: 2 }}
                />
              </div>

              {/* Enabled toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, enabled: !form.enabled })}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form.enabled ? "bg-emerald-500" : "bg-gray-300"}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.enabled ? "translate-x-[22px]" : "translate-x-0.5"}`}
                  />
                </button>
                <span className="text-sm text-[#1B1C15]">
                  {form.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              {/* Test Webhook */}
              <div className="border border-dashed border-[rgba(0,0,0,0.1)] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider">
                    Test Webhook
                  </span>
                  <button
                    onClick={handleTest}
                    disabled={testing || !form.webhookUrl}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#1B1C15] text-white hover:bg-[#1B1C15]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {testing ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    {testing ? "Sending..." : "Send Test"}
                  </button>
                </div>
                <p className="text-[11px] text-[rgba(0,0,0,0.35)] mb-3">
                  Sends a POST request to your webhook URL with the body template (or a test payload)
                </p>

                {testResult && (
                  <div className={`rounded-xl p-3 text-sm ${testResult.status >= 200 && testResult.status < 300 ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {testResult.status >= 200 && testResult.status < 300 ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <AlertCircle size={14} className="text-amber-600" />
                      )}
                      <span className="font-semibold text-[13px]">
                        Status: {testResult.status}
                      </span>
                    </div>
                    <pre className="text-xs font-mono text-[rgba(0,0,0,0.6)] whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                      {testResult.body || "(empty response)"}
                    </pre>
                  </div>
                )}

                {testError && (
                  <div className="rounded-xl p-3 text-sm bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} className="text-red-600" />
                      <span className="font-semibold text-red-700 text-[13px]">{testError}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 p-5 sm:p-6 border-t border-[rgba(0,0,0,0.06)]">
              <button
                onClick={() => {
                  setShowModal(false);
                  setTestResult(null);
                  setTestError(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.description || !form.webhookUrl}
                className="btn-premium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : editId ? (
                  "Update Action"
                ) : (
                  "Create Action"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
