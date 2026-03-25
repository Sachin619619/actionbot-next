import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processSlackEvent } from "@/lib/channels/slack";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("t");
    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenant" }, { status: 400 });
    }

    const body = await request.json();

    // Handle Slack URL verification challenge
    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge });
    }

    const channel = await prisma.channel.findFirst({
      where: { tenantId, type: "slack", isActive: true },
    });
    if (!channel) {
      return NextResponse.json({ ok: true });
    }

    const config = channel.config as { botToken: string; signingSecret: string };

    // Process async
    processSlackEvent(body, tenantId, config).catch((err) =>
      console.error("Slack processing error:", err)
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Slack webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}
