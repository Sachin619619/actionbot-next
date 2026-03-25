import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processWhatsAppMessage } from "@/lib/channels/whatsapp";

// Webhook verification (GET)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const tenantId = url.searchParams.get("t");

  if (!tenantId) {
    return NextResponse.json({ error: "Missing tenant" }, { status: 400 });
  }

  const channel = await prisma.channel.findFirst({
    where: { tenantId, type: "whatsapp", isActive: true },
  });

  if (!channel) {
    return NextResponse.json({ error: "Channel not configured" }, { status: 404 });
  }

  const config = channel.config as { verifyToken: string };

  if (mode === "subscribe" && token === config.verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// Incoming messages (POST)
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("t");
    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenant" }, { status: 400 });
    }

    const channel = await prisma.channel.findFirst({
      where: { tenantId, type: "whatsapp", isActive: true },
    });
    if (!channel) {
      return NextResponse.json({ ok: true });
    }

    const config = channel.config as { phoneNumberId: string; accessToken: string; verifyToken: string };
    const body = await request.json();

    // Process WhatsApp Cloud API webhook format
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== "messages") continue;
        const messages = change.value?.messages || [];
        const contacts = change.value?.contacts || [];

        for (const message of messages) {
          const contact = contacts.find((c: any) => c.wa_id === message.from);
          processWhatsAppMessage(message, tenantId, config, contact?.profile?.name).catch((err) =>
            console.error("WhatsApp processing error:", err)
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("WhatsApp webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}
