import { NextResponse } from "next/server";
import { getApiKeyTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const tenant = await getApiKeyTenant(request);
  if (!tenant) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const { sessionId } = await params;
  const session = await prisma.chatSession.findFirst({ where: { id: sessionId, tenantId: tenant.id } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  const pendingConfirmations = await prisma.confirmation.findMany({
    where: { sessionId, status: "pending" },
  });

  const botConfig = await prisma.botConfig.findFirst({ where: { tenantId: tenant.id } });

  return NextResponse.json({
    messages,
    pendingConfirmations,
    botName: botConfig?.name || "AI Assistant",
    welcomeMessage: botConfig?.welcomeMessage || "",
  });
}
