import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = await getAuthTenant(request);
  if (!tenant)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const session = await prisma.chatSession.findFirst({
    where: { id, tenantId: tenant.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!session)
    return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const userMessages = session.messages.filter((m) => m.role === "user");
  const assistantMessages = session.messages.filter(
    (m) => m.role === "assistant"
  );

  const start = new Date(session.startedAt).getTime();
  const lastMsg = session.messages[session.messages.length - 1];
  const end = session.lastMessageAt
    ? new Date(session.lastMessageAt).getTime()
    : lastMsg
    ? new Date(lastMsg.createdAt).getTime()
    : start;
  const durationMs = end - start;

  const thirtyMinMs = 30 * 60 * 1000;
  const isActive = lastMsg
    ? Date.now() - new Date(lastMsg.createdAt).getTime() < thirtyMinMs
    : false;

  return NextResponse.json({
    id: session.id,
    externalUserId: session.externalUserId,
    startedAt: session.startedAt,
    lastMessageAt: session.lastMessageAt,
    metadata: session.metadata,
    status: isActive ? "active" : "ended",
    durationMs,
    messageCount: session.messages.length,
    userMessageCount: userMessages.length,
    assistantMessageCount: assistantMessages.length,
    messages: session.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      toolCall: m.toolCall,
      toolResult: m.toolResult,
      createdAt: m.createdAt,
    })),
  });
}
