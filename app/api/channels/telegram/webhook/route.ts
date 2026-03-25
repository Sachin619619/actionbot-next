import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processTelegramUpdate } from "@/lib/channels/telegram";

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("t");
    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenant" }, { status: 400 });
    }

    const channel = await prisma.channel.findFirst({
      where: { tenantId, type: "telegram", isActive: true },
    });
    if (!channel) {
      return NextResponse.json({ error: "Channel not configured" }, { status: 404 });
    }

    const config = channel.config as { botToken: string };
    const update = await request.json();

    // Process async - respond immediately to Telegram
    processTelegramUpdate(update, tenantId, config).catch((err) =>
      console.error("Telegram processing error:", err)
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
