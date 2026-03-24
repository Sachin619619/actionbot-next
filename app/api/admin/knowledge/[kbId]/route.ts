import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(request: Request, { params }: { params: Promise<{ kbId: string }> }) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kbId } = await params;
  const existing = await prisma.knowledgeBase.findFirst({ where: { id: kbId, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: "Knowledge entry not found" }, { status: 404 });

  const body = await request.json();
  const kb = await prisma.knowledgeBase.update({ where: { id: kbId }, data: body });

  return NextResponse.json(kb);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ kbId: string }> }) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { kbId } = await params;
  const existing = await prisma.knowledgeBase.findFirst({ where: { id: kbId, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: "Knowledge entry not found" }, { status: 404 });

  await prisma.knowledgeBase.delete({ where: { id: kbId } });

  return NextResponse.json({ message: "Knowledge entry deleted" });
}
