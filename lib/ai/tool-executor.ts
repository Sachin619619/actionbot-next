import type { Tool, Action } from "@prisma/client";

export async function executeTool(tool: Tool, params: Record<string, any>): Promise<{ output: any; isError: boolean }> {
  try {
    if (tool.endpointUrl.startsWith("internal://")) {
      const result = await executeInternalTool(tool.endpointUrl, params);
      return { output: result, isError: false };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(tool.headers as Record<string, string>),
    };

    const authConfig = tool.authConfig as any;
    if (authConfig) {
      if (authConfig.type === "bearer") headers["Authorization"] = `Bearer ${authConfig.token}`;
      else if (authConfig.type === "api_key") headers[authConfig.header || "X-API-Key"] = authConfig.key;
    }

    const method = tool.httpMethod.toUpperCase();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), tool.timeoutSeconds * 1000);

    let url = tool.endpointUrl;
    const fetchOptions: RequestInit = { method, headers, signal: controller.signal };

    if (method === "GET") {
      const queryParams = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
      url += `?${queryParams.toString()}`;
    } else {
      fetchOptions.body = JSON.stringify(params);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeout);

    const data = await response.json().catch(() => ({ status: response.status }));

    if (!response.ok) return { output: { error: `HTTP ${response.status}`, data }, isError: true };

    return { output: data, isError: false };
  } catch (err: any) {
    if (err.name === "AbortError") return { output: { error: `Tool timed out after ${tool.timeoutSeconds}s` }, isError: true };
    return { output: { error: err.message }, isError: true };
  }
}

export async function executeAction(action: Action, params: Record<string, any>): Promise<{ output: any; isError: boolean }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((action.headers as Record<string, string>) || {}),
    };

    // Build request body from template if provided, otherwise use params directly
    let requestBody: any = params;
    if (action.bodyTemplate) {
      requestBody = interpolateTemplate(action.bodyTemplate as Record<string, any>, params);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(action.webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json().catch(() => ({ status: response.status }));

    if (!response.ok) return { output: { error: `HTTP ${response.status}`, data }, isError: true };

    return { output: data, isError: false };
  } catch (err: any) {
    if (err.name === "AbortError") return { output: { error: "Action webhook timed out after 30s" }, isError: true };
    return { output: { error: err.message }, isError: true };
  }
}

function interpolateTemplate(template: Record<string, any>, params: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(template)) {
    if (typeof value === "string") {
      result[key] = value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : `{{${paramKey}}}`;
      });
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = interpolateTemplate(value, params);
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function executeInternalTool(endpoint: string, params: Record<string, any>): Promise<any> {
  const path = endpoint.replace("internal://", "");
  const [module, func] = path.split("/");

  if (module === "food") {
    const foodTools = await import("@/lib/demo/food-tools");
    const handler = (foodTools as any)[func];
    if (!handler) throw new Error(`Unknown internal tool: ${func}`);
    return handler(params);
  }

  throw new Error(`Unknown internal module: ${module}`);
}
