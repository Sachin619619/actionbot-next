"use client";
import { useEffect, useState } from "react";
import { admin } from "@/lib/api";
import {
  FileCode2, Copy, Check, ChevronDown, ChevronRight,
  Send, MessageSquare, Bot, Key, Zap,
} from "lucide-react";

interface Endpoint {
  method: string;
  path: string;
  description: string;
  auth: string;
  body?: Record<string, string>;
  response?: string;
  example?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "POST",
    path: "/api/chat/message",
    description: "Send a message to the AI bot and receive a response. This is the main endpoint for chat interactions.",
    auth: "X-API-Key",
    body: {
      message: "string (required) — The user's message",
      sessionId: "string (optional) — Existing session ID to continue conversation",
      externalUserId: "string (optional) — Your user identifier",
      userContext: "object (optional) — { email, name, phone }",
    },
    response: `{
  "sessionId": "uuid",
  "type": "text | confirmation_required | error",
  "content": "Bot response text",
  "confirmation": { "id": "uuid", "toolName": "...", "summary": "..." },
  "attachments": [{ "type": "card", "data": {...} }]
}`,
    example: `curl -X POST https://actionbot-next.vercel.app/api/chat/message \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"message": "Hello!", "externalUserId": "user123"}'`,
  },
  {
    method: "POST",
    path: "/api/chat/session",
    description: "Create a new chat session explicitly.",
    auth: "X-API-Key",
    body: { externalUserId: "string (optional)" },
    response: `{ "id": "uuid", "tenantId": "uuid" }`,
  },
  {
    method: "GET",
    path: "/api/chat/history/{sessionId}",
    description: "Retrieve full message history for a session.",
    auth: "X-API-Key",
    response: `[{ "role": "user|assistant|tool_result", "content": "...", "createdAt": "..." }]`,
  },
  {
    method: "POST",
    path: "/api/chat/confirm/{confirmationId}",
    description: "Confirm or reject a pending tool action (for sensitive tools).",
    auth: "X-API-Key",
    body: { action: '"confirm" or "reject"' },
    response: `{ "type": "text", "content": "..." }`,
  },
  {
    method: "POST",
    path: "/api/chat/feedback",
    description: "Submit user feedback/rating for a conversation or specific message.",
    auth: "X-API-Key",
    body: {
      sessionId: "string (required)",
      rating: "number — 1-5 for conversation, 1 or -1 for message thumbs",
      comment: "string (optional)",
      type: '"conversation" or "message"',
      messageIndex: "number (optional) — for message-level feedback",
    },
  },
];

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: "bg-green-100", text: "text-green-700" },
  POST: { bg: "bg-blue-100", text: "text-blue-700" },
  PUT: { bg: "bg-amber-100", text: "text-amber-700" },
  DELETE: { bg: "bg-red-100", text: "text-red-700" },
};

export default function ApiDocsPage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  useEffect(() => {
    admin.getWidgetCode().then((data) => setApiKey(data?.apiKey || "YOUR_API_KEY")).catch(console.error);
  }, []);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleEndpoint = (index: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <FileCode2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: "var(--font-serif, 'Playfair Display', serif)" }}>
              API Documentation
            </h1>
            <p className="text-gray-500 text-[15px]">Integrate ActionBot into your apps</p>
          </div>
        </div>
      </div>

      {/* Auth Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <Key size={16} className="text-amber-600" />
          </div>
          <h2 className="text-base font-bold text-gray-900">Authentication</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          All chat API endpoints require your API key passed via the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-[#e85d04]">X-API-Key</code> header.
        </p>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-100">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your API Key:</span>
          <code className="flex-1 text-sm font-mono text-gray-700">{apiKey}</code>
          <button
            onClick={() => copyText(apiKey, "apikey")}
            className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {copied === "apikey" ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Base URL */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-2">Base URL</h3>
        <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-xl p-3">
          <code className="text-sm font-mono text-green-400 flex-1">https://actionbot-next.vercel.app</code>
          <button
            onClick={() => copyText("https://actionbot-next.vercel.app", "baseurl")}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            {copied === "baseurl" ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)" }}>
          <Zap size={18} className="text-[#e85d04]" /> Endpoints
        </h2>

        {ENDPOINTS.map((ep, i) => {
          const isOpen = expanded.has(i);
          const colors = METHOD_COLORS[ep.method] || METHOD_COLORS.GET;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleEndpoint(i)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
              >
                <span className={`${colors.bg} ${colors.text} px-2.5 py-1 rounded-lg text-[11px] font-bold`}>
                  {ep.method}
                </span>
                <code className="text-sm font-mono text-gray-700 flex-1">{ep.path}</code>
                {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-600 mb-4">{ep.description}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Auth:</span>
                    <code className="text-xs font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg border border-amber-100">{ep.auth}</code>
                  </div>

                  {ep.body && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Request Body</p>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5">
                        {Object.entries(ep.body).map(([key, val]) => (
                          <div key={key} className="flex gap-2 text-xs">
                            <code className="font-mono text-[#e85d04] font-semibold">{key}</code>
                            <span className="text-gray-500">— {val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ep.response && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Response</p>
                      <div className="bg-[#1a1a1a] rounded-xl p-3 overflow-x-auto">
                        <pre className="text-xs font-mono text-green-400 whitespace-pre">{ep.response}</pre>
                      </div>
                    </div>
                  )}

                  {ep.example && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Example (cURL)</p>
                        <button
                          onClick={() => copyText(ep.example!.replace("YOUR_API_KEY", apiKey), `ex-${i}`)}
                          className="text-xs text-[#e85d04] font-medium flex items-center gap-1"
                        >
                          {copied === `ex-${i}` ? <Check size={12} /> : <Copy size={12} />}
                          {copied === `ex-${i}` ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="bg-[#1a1a1a] rounded-xl p-3 overflow-x-auto">
                        <pre className="text-xs font-mono text-cyan-400 whitespace-pre-wrap">{ep.example.replace("YOUR_API_KEY", apiKey)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Webhook section */}
      <div className="mt-8 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
        <h2 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: "var(--font-serif)" }}>
          Channel Webhooks
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          ActionBot supports incoming webhooks for Telegram, WhatsApp, and Slack. Configure them in the Channels page — webhook URLs are generated automatically.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { name: "Telegram", path: "/api/channels/telegram/webhook?t={tenantId}", method: "POST" },
            { name: "WhatsApp", path: "/api/channels/whatsapp/webhook?t={tenantId}", method: "POST/GET" },
            { name: "Slack", path: "/api/channels/slack/webhook?t={tenantId}", method: "POST" },
          ].map((wh, i) => (
            <div key={i} className="bg-white/70 rounded-xl p-3 border border-purple-100/50">
              <p className="text-xs font-bold text-gray-700 mb-1">{wh.name}</p>
              <code className="text-[10px] font-mono text-purple-600 break-all">{wh.path}</code>
              <p className="text-[10px] text-gray-400 mt-1">{wh.method}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
