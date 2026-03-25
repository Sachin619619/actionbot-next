import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    plan: tenant.plan,
    apiKey: tenant.apiKey,
    createdAt: tenant.createdAt,
  });
}

export async function PUT(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  if (name.trim().length > 100) {
    return NextResponse.json({ error: "Name must be 100 characters or less" }, { status: 400 });
  }

  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: { name: name.trim() },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    plan: updated.plan,
    apiKey: updated.apiKey,
    createdAt: updated.createdAt,
  });
}
