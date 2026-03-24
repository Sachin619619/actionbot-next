import { NextResponse } from "next/server";
import { getApiKeyTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AIOrchestrator } from "@/lib/ai/orchestrator";

export async function POST(request: Request, { params }: { params: Promise<{ confirmationId: string }> }) {
  try {
    const tenant = await getApiKeyTenant(request);
    if (!tenant) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

    const { action } = await request.json();
    const { confirmationId } = await params;

    if (!action || !["confirm", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'confirm' or 'reject'" }, { status: 400 });
    }

    const confirmation = await prisma.confirmation.findUnique({
      where: { id: confirmationId },
      include: { session: true },
    });

    if (!confirmation || confirmation.session.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Confirmation not found" }, { status: 404 });
    }

    const orchestrator = new AIOrchestrator(tenant.id);
    const result = await orchestrator.handleConfirmation(confirmationId, action as "confirm" | "reject");

    return NextResponse.json({ sessionId: confirmation.sessionId, ...result });
  } catch (err: any) {
    console.error("Confirmation error:", err?.message, err?.stack);
    return NextResponse.json({
      type: "error",
      content: "Something went wrong processing your confirmation.",
      errorDetail: err?.message || String(err),
    }, { status: 500 });
  }
}
