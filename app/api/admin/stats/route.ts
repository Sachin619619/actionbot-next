import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [sessionCount, messageCount, toolCount, activeTools] = await Promise.all([
    prisma.chatSession.count({ where: { tenantId: tenant.id } }),
    prisma.message.count({ where: { session: { tenantId: tenant.id } } }),
    prisma.tool.count({ where: { tenantId: tenant.id } }),
    prisma.tool.count({ where: { tenantId: tenant.id, isActive: true } }),
  ]);

  return NextResponse.json({ sessionCount, messageCount, toolCount, activeTools });
}
