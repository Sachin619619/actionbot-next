import { NextResponse } from "next/server";
import { getApiKeyTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AIOrchestrator } from "@/lib/ai/orchestrator";

export async function POST(request: Request) {
  try {
    const tenant = await getApiKeyTenant(request);
    if (!tenant) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

    const { message, sessionId, externalUserId, userContext } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    let sid = sessionId;
    if (!sid) {
      const session = await prisma.chatSession.create({
        data: { tenantId: tenant.id, externalUserId: externalUserId || null },
      });
      sid = session.id;
    } else {
      const existing = await prisma.chatSession.findFirst({
        where: { id: sid, tenantId: tenant.id },
      });
      if (!existing) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
    }

    // Store authenticated user context in session for security
    if (userContext?.email) {
      await prisma.chatSession.update({
        where: { id: sid },
        data: { metadata: { authenticatedEmail: userContext.email, authenticatedName: userContext.name || "" } },
      });
    }

    const orchestrator = new AIOrchestrator(tenant.id);
    const result = await orchestrator.processMessage(sid, message);

    return NextResponse.json({ sessionId: sid, ...result });
  } catch (err: any) {
    console.error("Chat error:", err?.message, err?.stack);
    return NextResponse.json({
      type: "error",
      content: "Something went wrong. Please try again.",
      debug: process.env.NODE_ENV !== "production" ? err?.message : undefined,
      errorDetail: err?.message || String(err),
    }, { status: 500 });
  }
}
