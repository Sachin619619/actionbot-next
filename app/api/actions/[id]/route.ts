import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const action = await prisma.action.findFirst({ where: { id, tenantId: tenant.id } });
  if (!action) return NextResponse.json({ error: "Action not found" }, { status: 404 });

  return NextResponse.json(action);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.action.findFirst({ where: { id, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: "Action not found" }, { status: 404 });

  const body = await request.json();
  const action = await prisma.action.update({ where: { id }, data: body });

  return NextResponse.json(action);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.action.findFirst({ where: { id, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: "Action not found" }, { status: 404 });

  await prisma.action.delete({ where: { id } });

  return NextResponse.json({ message: "Action deleted" });
}
