import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
  const page = Math.max(parseInt(url.searchParams.get("page") || "1"), 1);
  const search = url.searchParams.get("search")?.trim() || "";
  const status = url.searchParams.get("status") || "all"; // all | active | ended
  const offset = (page - 1) * limit;

  const where: any = { tenantId: tenant.id };

  if (search) {
    where.OR = [
      { externalUserId: { contains: search, mode: "insensitive" } },
      { id: { contains: search, mode: "insensitive" } },
    ];
  }

  // Active = has recent message within 30 min, Ended = otherwise
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  if (status === "active") {
    where.lastMessageAt = { gte: thirtyMinAgo };
  } else if (status === "ended") {
    where.OR = [
      { lastMessageAt: { lt: thirtyMinAgo } },
      { lastMessageAt: null },
    ];
  }

  const [sessions, totalCount] = await Promise.all([
    prisma.chatSession.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        _count: { select: { messages: true } },
        messages: {
          select: { createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.chatSession.count({ where }),
  ]);

  const thirtyMinMs = 30 * 60 * 1000;
  const data = sessions.map((s) => {
    const lastMsg = s.messages[0];
    const isActive = lastMsg
      ? Date.now() - new Date(lastMsg.createdAt).getTime() < thirtyMinMs
      : false;

    // Calculate duration
    const start = new Date(s.startedAt).getTime();
    const end = s.lastMessageAt
      ? new Date(s.lastMessageAt).getTime()
      : lastMsg
      ? new Date(lastMsg.createdAt).getTime()
      : start;
    const durationMs = end - start;

    return {
      id: s.id,
      externalUserId: s.externalUserId,
      startedAt: s.startedAt,
      lastMessageAt: s.lastMessageAt,
      messageCount: s._count.messages,
      status: isActive ? "active" : "ended",
      durationMs,
      metadata: s.metadata,
    };
  });

  return NextResponse.json({
    sessions: data,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
    },
  });
}
