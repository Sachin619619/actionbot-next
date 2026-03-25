import { NextResponse } from "next/server";
import { getApiKeyTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const tenant = await getApiKeyTenant(request);
  if (!tenant) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { sessionId, messageIndex, rating, comment, type } = body;

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  if (rating === undefined || rating === null) {
    return NextResponse.json({ error: "rating is required" }, { status: 400 });
  }

  const feedbackType = type || "conversation";

  // Validate rating based on type
  if (feedbackType === "message" && ![1, -1].includes(rating)) {
    return NextResponse.json({ error: "Message rating must be 1 (thumbs up) or -1 (thumbs down)" }, { status: 400 });
  }

  if (feedbackType === "conversation" && (rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "Conversation rating must be between 1 and 5" }, { status: 400 });
  }

  // Verify the session belongs to this tenant
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, tenantId: tenant.id },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const feedback = await prisma.feedback.create({
    data: {
      sessionId,
      tenantId: tenant.id,
      rating,
      comment: comment || null,
      messageIdx: messageIndex ?? null,
      type: feedbackType,
    },
  });

  return NextResponse.json({ success: true, feedbackId: feedback.id }, { status: 201 });
}
