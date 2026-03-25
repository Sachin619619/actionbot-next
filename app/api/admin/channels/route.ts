import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setTelegramWebhook, removeTelegramWebhook } from "@/lib/channels/telegram";
import crypto from "crypto";

// List channels
export async function GET(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const channels = await prisma.channel.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(channels);
}

// Create or update channel
export async function POST(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, name, config, isActive } = await request.json();

  if (!type || !["telegram", "whatsapp", "slack", "discord"].includes(type)) {
    return NextResponse.json({ error: "Invalid channel type" }, { status: 400 });
  }

  const webhookSecret = crypto.randomBytes(32).toString("hex");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://actionbot-next.vercel.app";

  // Upsert channel (one per type per tenant)
  const channel = await prisma.channel.upsert({
    where: { tenantId_type: { tenantId: tenant.id, type } },
    create: {
      tenantId: tenant.id,
      type,
      name: name || type,
      config: config || {},
      isActive: isActive ?? true,
      webhookSecret,
    },
    update: {
      name: name || type,
      config: config || {},
      isActive: isActive ?? true,
    },
  });

  // Auto-setup Telegram webhook
  if (type === "telegram" && config?.botToken && isActive !== false) {
    const webhookUrl = `${appUrl}/api/channels/telegram/webhook?t=${tenant.id}`;
    try {
      await setTelegramWebhook(config.botToken, webhookUrl);
    } catch (err) {
      console.error("Failed to set Telegram webhook:", err);
    }
  }

  // Generate webhook URLs for the response
  const webhookUrls: Record<string, string> = {
    telegram: `${appUrl}/api/channels/telegram/webhook?t=${tenant.id}`,
    whatsapp: `${appUrl}/api/channels/whatsapp/webhook?t=${tenant.id}`,
    slack: `${appUrl}/api/channels/slack/webhook?t=${tenant.id}`,
    discord: `${appUrl}/api/channels/discord/webhook?t=${tenant.id}`,
  };

  return NextResponse.json({ ...channel, webhookUrl: webhookUrls[type] });
}

// Delete channel
export async function DELETE(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await request.json();

  const channel = await prisma.channel.findFirst({
    where: { tenantId: tenant.id, type },
  });

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  // Remove Telegram webhook if disconnecting
  if (type === "telegram") {
    const config = channel.config as { botToken?: string };
    if (config?.botToken) {
      try { await removeTelegramWebhook(config.botToken); } catch {}
    }
  }

  await prisma.channel.delete({ where: { id: channel.id } });

  return NextResponse.json({ ok: true });
}
