"use client";

import { useEffect, useState } from "react";
import { admin } from "@/lib/api";
import { Plus, Trash2, Edit2, BookOpen, X, Upload, FileText, Loader2, Search } from "lucide-react";

export default function KnowledgePage() {
  const [items, setItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    setBulkImporting(true);
    try {
      // Parse Q&A format: lines starting with Q: or A: or separated by blank lines
      const entries: { title: string; content: string }[] = [];
      const lines = bulkText.split("\n");
      let currentTitle = "";
      let currentContent = "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("Q:") || trimmed.startsWith("Q :") || trimmed.startsWith("Question:")) {
          if (currentTitle && currentContent) {
            entries.push({ title: currentTitle, content: currentContent.trim() });
          }
          currentTitle = trimmed.replace(/^(Q\s*:|Question:)\s*/i, "").trim();
          currentContent = "";
        } else if (trimmed.startsWith("A:") || trimmed.startsWith("A :") || trimmed.startsWith("Answer:")) {
          currentContent = trimmed.replace(/^(A\s*:|Answer:)\s*/i, "").trim();
        } else if (trimmed === "" && currentTitle && currentContent) {
          entries.push({ title: currentTitle, content: currentContent.trim() });
          currentTitle = "";
          currentContent = "";
        } else if (currentTitle) {
          currentContent += (currentContent ? "\n" : "") + trimmed;
        }
      }
      // Don't forget the last entry
      if (currentTitle && currentContent) {
        entries.push({ title: currentTitle, content: currentContent.trim() });
      }

      // If no Q/A format detected, try splitting by double newlines
      if (entries.length === 0) {
        const blocks = bulkText.split(/\n\s*\n/).filter(Boolean);
        for (const block of blocks) {
          const blockLines = block.trim().split("\n");
          const blockTitle = blockLines[0].replace(/^[-*#]+\s*/, "").trim();
          const blockContent = blockLines.slice(1).join("\n").trim() || blockTitle;
          if (blockTitle) entries.push({ title: blockTitle, content: blockContent });
        }
      }

      if (entries.length === 0) {
        alert("Could not parse any entries. Use Q:/A: format or separate entries with blank lines.");
        return;
      }

      // Create all entries
      for (const entry of entries) {
        await admin.createKnowledge({ title: entry.title, content: entry.content, category: "imported" });
      }

      alert(`Successfully imported ${entries.length} entries! 🎉`);
      setBulkText("");
      setShowBulkImport(false);
      load();
    } catch (err: any) {
      alert("Import failed: " + (err.message || "Unknown error"));
    } finally {
      setBulkImporting(false);
    }
  };

  const filteredItems = searchQuery
    ? items.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1B1C15]">Knowledge Base</h1>
          <p className="text-[rgba(0,0,0,0.5)] mt-1 text-[15px]">FAQs, policies, and business context for your AI</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <Upload size={16} /> Bulk Import
          </button>
          <button onClick={() => { reset(); setShowModal(true); }} className="btn-premium">
            <Plus size={18} /> Add Entry
          </button>
        </div>
      </div>

      {/* Search */}
      {items.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-gray-200">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search knowledge base..."
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
            />
            {searchQuery && (
              <span className="text-xs text-gray-400">{filteredItems.length} results</span>
            )}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="premium-card p-12 text-center">
          <div className="w-16 h-16 bg-[#f5eed8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={28} className="text-[#1B1C15]/30" />
          </div>
          <p className="text-[rgba(0,0,0,0.5)] text-[15px]">No knowledge entries yet. Add FAQs, policies, and business info.</p>
        </div>
      ) : (
        <div className="grid gap-4 stagger-children">
          {filteredItems.map((item) => (
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

      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 modal-overlay flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="premium-card w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-[20px] animate-slide-up">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Upload size={16} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#1B1C15]">Bulk Import</h2>
                  <p className="text-xs text-gray-400">Import multiple Q&A entries at once</p>
                </div>
              </div>
              <button onClick={() => setShowBulkImport(false)} className="p-2 hover:bg-[#f5eed8] rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
                  <FileText size={12} /> Supported Format
                </p>
                <pre className="text-[11px] text-blue-600 font-mono bg-white/60 rounded-lg p-3 leading-relaxed">{`Q: What is your return policy?
A: We accept returns within 30 days of purchase.

Q: How do I track my order?
A: You can track your order in the Orders section.

Q: What payment methods do you accept?
A: We accept credit cards, PayPal, and UPI.`}</pre>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1B1C15]/60 uppercase tracking-wider mb-2">
                  Paste your Q&A entries
                </label>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={12}
                  className="premium-input font-mono text-sm"
                  placeholder="Q: Your question here?\nA: Your answer here.\n\nQ: Another question?\nA: Another answer."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 sm:p-6 border-t border-[rgba(0,0,0,0.06)]">
              <button onClick={() => setShowBulkImport(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={handleBulkImport}
                disabled={!bulkText.trim() || bulkImporting}
                className="btn-premium disabled:opacity-50"
              >
                {bulkImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {bulkImporting ? "Importing..." : "Import All"}
              </button>
            </div>
          </div>
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
