import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";

export async function GET(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  return NextResponse.json({
    apiKey: tenant.apiKey,
    embedCode: `<script src="${baseUrl}/widget.js" data-tenant="${tenant.apiKey}" data-api="${baseUrl}"></script>`,
  });
}
