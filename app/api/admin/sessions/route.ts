import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const sessions = await prisma.chatSession.findMany({
    where: { tenantId: tenant.id },
    orderBy: { startedAt: "desc" },
    take: limit, skip: offset,
    include: { _count: { select: { messages: true } } },
  });

  return NextResponse.json(
    sessions.map((s) => ({
      id: s.id, tenantId: s.tenantId, externalUserId: s.externalUserId,
      startedAt: s.startedAt, lastMessageAt: s.lastMessageAt,
      messageCount: s._count.messages,
    }))
  );
}
