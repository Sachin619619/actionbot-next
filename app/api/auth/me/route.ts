import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";

export async function GET(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    id: tenant.id, name: tenant.name, email: tenant.email,
    plan: tenant.plan, apiKey: tenant.apiKey, isActive: tenant.isActive, createdAt: tenant.createdAt,
  });
}
