"use client";

import { useEffect, useState } from "react";
import { admin } from "@/lib/api";
import { Plus, Trash2, Edit2, BookOpen, X } from "lucide-react";

export default function KnowledgePage() {
  const [items, setItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => { load(); }, []);
  const load = () => admin.getKnowledge().then(setItems).catch(console.error);

  const handleSave = async () => {
    if (editId) await admin.updateKnowledge(editId, { title, content, category });
    else await admin.createKnowledge({ title, content, category });
    reset(); load();
  };

  const handleEdit = (item: any) => {
    setTitle(item.title); setContent(item.content); setCategory(item.category || "");
    setEditId(item.id); setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this knowledge entry?")) return;
    await admin.deleteKnowledge(id); load();
  };

  const reset = () => { setShowModal(false); setEditId(null); setTitle(""); setContent(""); setCategory(""); };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1B1C15]">Knowledge Base</h1>
          <p className="text-[rgba(0,0,0,0.5)] mt-1 text-[15px]">FAQs, policies, and business context for your AI</p>
        </div>
        <button onClick={() => { reset(); setShowModal(true); }} className="btn-premium">
          <Plus size={18} /> Add Entry
        </button>
      </div>

      {items.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <div className="w-16 h-16 bg-[#f5eed8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-[#1B1C15]/30" />
          </div>
          <p className="text-[rgba(0,0,0,0.5)] text-[15px]">No knowledge entries yet. Add FAQs, policies, and business info.</p>
        </div>
      ) : (
        <div className="grid gap-4 stagger-children">
          {items.map((item) => (
            <div key={item.id} className="premium-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-[17px] font-serif font-bold text-[#1B1C15]">{item.title}</h3>
                    {item.category && <span className="pill text-[11px]">{item.category}</span>}
                  </div>
                  <p className="text-sm text-[rgba(0,0,0,0.5)] whitespace-pre-wrap leading-relaxed">{item.content}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleEdit(item)} className="p-2.5 rounded-xl text-[#1B1C15]/40 hover:text-[#1B1C15] hover:bg-[#f5eed8] transition-all"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-2.5 rounded-xl text-[#1B1C15]/40 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 modal-overlay flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="premium-card w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-[20px] animate-slide-up">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[rgba(0,0,0,0.06)]">
              <h2 className="text-lg font-serif font-bold text-[#1B1C15]">{editId ? "Edit Entry" : "Add Knowledge"}</h2>
              <button onClick={reset} className="p-2 hover:bg-[#f5eed8] rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="premium-input" placeholder="e.g., Refund Policy" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Category</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} className="premium-input" placeholder="e.g., faq, policy, general" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">Content</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="premium-input" placeholder="Write the knowledge content here..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 sm:p-6 border-t border-[rgba(0,0,0,0.06)]">
              <button onClick={reset} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn-premium">{editId ? "Update" : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
