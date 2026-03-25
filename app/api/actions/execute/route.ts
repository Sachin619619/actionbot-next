import { NextResponse } from "next/server";
import { getApiKeyTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const tenant = await getApiKeyTenant(request);
    if (!tenant) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

    const { actionId, params } = await request.json();

    if (!actionId) {
      return NextResponse.json({ error: "actionId is required" }, { status: 400 });
    }

    const action = await prisma.action.findFirst({
      where: { id: actionId, tenantId: tenant.id, enabled: true },
    });

    if (!action) {
      return NextResponse.json({ error: "Action not found or disabled" }, { status: 404 });
    }

    // Build request body from template if provided, otherwise use params directly
    let requestBody: any = params || {};
    if (action.bodyTemplate) {
      requestBody = interpolateTemplate(action.bodyTemplate as Record<string, any>, params || {});
    }

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((action.headers as Record<string, string>) || {}),
    };

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

    if (!response.ok) {
      return NextResponse.json(
        { error: `Webhook returned HTTP ${response.status}`, data },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json({ error: "Webhook request timed out" }, { status: 504 });
    }
    console.error("Action execute error:", err?.message, err?.stack);
    return NextResponse.json(
      { error: "Failed to execute action", detail: err?.message },
      { status: 500 }
    );
  }
}

/**
 * Interpolates a body template with params.
 * Replaces {{key}} placeholders in template values with matching param values.
 */
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
