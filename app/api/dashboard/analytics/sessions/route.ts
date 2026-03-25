import { NextResponse } from "next/server";
import { getApiKeyTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const tenant = await getApiKeyTenant(request);
  if (!tenant) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const [sessions, totalCount] = await Promise.all([
    prisma.chatSession.findMany({
      where: { tenantId: tenant.id },
      orderBy: { startedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        messages: {
          select: { id: true, role: true, content: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.chatSession.count({ where: { tenantId: tenant.id } }),
  ]);

  const data = sessions.map((s) => {
    const userMessages = s.messages.filter((m) => m.role === "user");
    const assistantMessages = s.messages.filter((m) => m.role === "assistant");
    const firstUserMessage = userMessages[0]?.content || null;
    const lastMessage = s.messages[s.messages.length - 1];

    return {
      id: s.id,
      externalUserId: s.externalUserId,
      startedAt: s.startedAt,
      lastMessageAt: s.lastMessageAt,
      metadata: s.metadata,
      messageCount: s.messages.length,
      userMessageCount: userMessages.length,
      assistantMessageCount: assistantMessages.length,
      firstUserMessage,
      lastMessagePreview: lastMessage?.content?.slice(0, 120) || null,
      lastMessageRole: lastMessage?.role || null,
      lastMessageTime: lastMessage?.createdAt || null,
    };
  });

  return NextResponse.json({
    sessions: data,
    pagination: {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount,
    },
  });
}
