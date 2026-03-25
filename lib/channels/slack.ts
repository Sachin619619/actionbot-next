import { prisma } from "@/lib/db";
import { AIOrchestrator } from "@/lib/ai/orchestrator";

interface SlackConfig {
  botToken: string;
  signingSecret: string;
  appId?: string;
}

interface SlackEvent {
  type: string;
  event?: {
    type: string;
    text: string;
    user: string;
    channel: string;
    ts: string;
    bot_id?: string;
  };
  challenge?: string;
}

export async function sendSlackMessage(botToken: string, channel: string, text: string, threadTs?: string) {
  const body: Record<string, string> = { channel, text };
  if (threadTs) body.thread_ts = threadTs;

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function processSlackEvent(event: SlackEvent, tenantId: string, config: SlackConfig) {
  // URL verification challenge
  if (event.type === "url_verification") {
    return { challenge: event.challenge };
  }

  const msg = event.event;
  if (!msg || msg.type !== "message" || msg.bot_id || !msg.text) return null;

  const channel = msg.channel;
  const userText = msg.text;
  const externalUserId = `slack_${msg.user}`;

  // Find or create session per channel+user
  let session = await prisma.chatSession.findFirst({
    where: { tenantId, externalUserId },
    orderBy: { startedAt: "desc" },
  });

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (!session || (session.lastMessageAt && session.lastMessageAt < oneHourAgo)) {
    session = await prisma.chatSession.create({
      data: {
        tenantId,
        externalUserId,
        metadata: {
          channel: "slack",
          slackChannel: channel,
          slackUser: msg.user,
        },
      },
    });
  }

  // Process through AI
  const orchestrator = new AIOrchestrator(tenantId);
  const result = await orchestrator.processMessage(session.id, userText);

  // Reply in thread
  if (result.type === "text" || result.type === "error") {
    await sendSlackMessage(config.botToken, channel, result.content, msg.ts);
  } else if (result.type === "confirmation_required") {
    await sendSlackMessage(
      config.botToken,
      channel,
      `${result.content}\n\n⚠️ *Action Required:* ${result.confirmation?.summary}\n\nReply "yes" to confirm or "no" to cancel.`,
      msg.ts
    );
  }

  return { ok: true };
}
