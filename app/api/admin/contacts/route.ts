import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all unique users with their session stats
  const sessions = await prisma.chatSession.findMany({
    where: { tenantId: tenant.id },
    select: {
      id: true,
      externalUserId: true,
      startedAt: true,
      lastMessageAt: true,
      metadata: true,
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  // Group by externalUserId
  const contactMap = new Map<
    string,
    {
      userId: string;
      sessionCount: number;
      totalMessages: number;
      firstSeen: Date;
      lastSeen: Date;
      metadata: any;
      sessions: { id: string; startedAt: Date; messageCount: number }[];
    }
  >();

  for (const s of sessions) {
    const uid = s.externalUserId || "anonymous";
    const existing = contactMap.get(uid);
    const lastSeen = s.lastMessageAt || s.startedAt;

    if (existing) {
      existing.sessionCount++;
      existing.totalMessages += s._count.messages;
      if (s.startedAt < existing.firstSeen) existing.firstSeen = s.startedAt;
      if (lastSeen > existing.lastSeen) existing.lastSeen = lastSeen;
      // Merge metadata
      if (s.metadata && typeof s.metadata === "object") {
        existing.metadata = { ...existing.metadata, ...(s.metadata as object) };
      }
      existing.sessions.push({
        id: s.id,
        startedAt: s.startedAt,
        messageCount: s._count.messages,
      });
    } else {
      contactMap.set(uid, {
        userId: uid,
        sessionCount: 1,
        totalMessages: s._count.messages,
        firstSeen: s.startedAt,
        lastSeen: lastSeen,
        metadata: s.metadata || {},
        sessions: [
          { id: s.id, startedAt: s.startedAt, messageCount: s._count.messages },
        ],
      });
    }
  }

  // Sort by last seen (most recent first)
  const contacts = Array.from(contactMap.values()).sort(
    (a, b) => b.lastSeen.getTime() - a.lastSeen.getTime()
  );

  return NextResponse.json({
    total: contacts.length,
    contacts,
  });
}
