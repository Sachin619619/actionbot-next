const API_BASE = "/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("actionbot_token");
}

export function setToken(token: string) {
  localStorage.setItem("actionbot_token", token);
}

export function clearToken() {
  localStorage.removeItem("actionbot_token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }

  return res.json();
}

export const auth = {
  signup: (data: { name: string; email: string; password: string }) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request("/auth/me"),
};

export const admin = {
  stats: () => request("/admin/stats"),
  getBotConfig: () => request("/admin/bot-config"),
  updateBotConfig: (data: any) =>
    request("/admin/bot-config", { method: "PUT", body: JSON.stringify(data) }),
  getTools: () => request("/admin/tools"),
  createTool: (data: any) =>
    request("/admin/tools", { method: "POST", body: JSON.stringify(data) }),
  updateTool: (id: string, data: any) =>
    request(`/admin/tools/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTool: (id: string) =>
    request(`/admin/tools/${id}`, { method: "DELETE" }),
  getKnowledge: () => request("/admin/knowledge"),
  createKnowledge: (data: any) =>
    request("/admin/knowledge", { method: "POST", body: JSON.stringify(data) }),
  updateKnowledge: (id: string, data: any) =>
    request(`/admin/knowledge/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteKnowledge: (id: string) =>
    request(`/admin/knowledge/${id}`, { method: "DELETE" }),
  getSessions: (params?: { page?: number; limit?: number; search?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    const query = qs.toString();
    return request(`/admin/sessions${query ? `?${query}` : ""}`);
  },
  getSession: (id: string) => request(`/admin/sessions/${id}`),
  getSessionMessages: (id: string) => request(`/admin/sessions/${id}/messages`),
  getLogs: () => request("/admin/logs"),
  getWidgetCode: () => request("/admin/widget-code"),
  replyToSession: (sessionId: string, message: string) =>
    request(`/admin/sessions/${sessionId}/reply`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  getContacts: () => request("/admin/contacts"),
};

export const actions = {
  list: () => request("/actions"),
  get: (id: string) => request(`/actions/${id}`),
  create: (data: any) =>
    request("/actions", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/actions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request(`/actions/${id}`, { method: "DELETE" }),
};

export const channels = {
  list: () => request("/admin/channels"),
  upsert: (data: { type: string; name?: string; config: any; isActive?: boolean }) =>
    request("/admin/channels", { method: "POST", body: JSON.stringify(data) }),
  remove: (type: string) =>
    request("/admin/channels", { method: "DELETE", body: JSON.stringify({ type }) }),
};

export const settings = {
  get: () => request("/settings"),
  update: (data: { name: string }) =>
    request("/settings", { method: "PUT", body: JSON.stringify(data) }),
  regenerateKey: () =>
    request("/settings/regenerate-key", { method: "POST" }),
};
