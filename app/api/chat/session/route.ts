import { NextResponse } from "next/server";
import { getApiKeyTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const tenant = await getApiKeyTenant(request);
  if (!tenant) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const { externalUserId, metadata } = await request.json().catch(() => ({}));

  const session = await prisma.chatSession.create({
    data: {
      tenantId: tenant.id,
      externalUserId: externalUserId || null,
      metadata: metadata || {},
    },
  });

  const botConfig = await prisma.botConfig.findUnique({ where: { tenantId: tenant.id } });

  return NextResponse.json({
    sessionId: session.id,
    welcomeMessage: botConfig?.welcomeMessage || "Hi! How can I help you?",
    botName: botConfig?.name || "AI Assistant",
    botAvatar: botConfig?.avatarUrl || null,
  }, { status: 201 });
}
