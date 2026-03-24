import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ toolId: string }> }) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toolId } = await params;
  const tool = await prisma.tool.findFirst({ where: { id: toolId, tenantId: tenant.id } });
  if (!tool) return NextResponse.json({ error: "Tool not found" }, { status: 404 });

  return NextResponse.json(tool);
}

export async function PUT(request: Request, { params }: { params: Promise<{ toolId: string }> }) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toolId } = await params;
  const existing = await prisma.tool.findFirst({ where: { id: toolId, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: "Tool not found" }, { status: 404 });

  const body = await request.json();
  const tool = await prisma.tool.update({ where: { id: toolId }, data: body });

  return NextResponse.json(tool);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ toolId: string }> }) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { toolId } = await params;
  const existing = await prisma.tool.findFirst({ where: { id: toolId, tenantId: tenant.id } });
  if (!existing) return NextResponse.json({ error: "Tool not found" }, { status: 404 });

  await prisma.tool.delete({ where: { id: toolId } });

  return NextResponse.json({ message: "Tool deleted" });
}
