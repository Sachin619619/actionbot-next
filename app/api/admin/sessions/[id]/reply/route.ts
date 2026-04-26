import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Admin sends a message directly into a chat session (human handoff)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = await getAuthTenant(request);
  if (!tenant)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { message } = await request.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Verify session belongs to tenant
  const session = await prisma.chatSession.findFirst({
    where: { id, tenantId: tenant.id },
  });

  if (!session)
    return NextResponse.json({ error: "Session not found" }, { status: 404 });

  // Store as assistant message with metadata indicating human agent
  const msg = await prisma.message.create({
    data: {
      sessionId: id,
      role: "assistant",
      content: message.trim(),
      toolCall: { _humanAgent: true, agentName: tenant.name },
    },
  });

  // Update session last message timestamp
  await prisma.chatSession.update({
    where: { id },
    data: { lastMessageAt: new Date() },
  });

  return NextResponse.json({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
    isHuman: true,
  });
}
