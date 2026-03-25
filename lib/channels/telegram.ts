import { prisma } from "@/lib/db";
import { AIOrchestrator } from "@/lib/ai/orchestrator";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; last_name?: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
    date: number;
  };
}

interface TelegramConfig {
  botToken: string;
  webhookUrl?: string;
}

export async function sendTelegramMessage(botToken: string, chatId: number | string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
  return res.json();
}

export async function sendTelegramTyping(botToken: string, chatId: number | string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

export async function setTelegramWebhook(botToken: string, webhookUrl: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
  return res.json();
}

export async function removeTelegramWebhook(botToken: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`, {
    method: "POST",
  });
  return res.json();
}

export async function processTelegramUpdate(update: TelegramUpdate, tenantId: string, config: TelegramConfig) {
  const msg = update.message;
  if (!msg?.text) return;

  const chatId = msg.chat.id;
  const userText = msg.text;
  const externalUserId = `telegram_${msg.from.id}`;

  // Skip bot commands like /start
  if (userText === "/start") {
    const botConfig = await prisma.botConfig.findUnique({ where: { tenantId } });
    await sendTelegramMessage(config.botToken, chatId, botConfig?.welcomeMessage || "Hi! How can I help you? 👋");
    return;
  }

  // Find or create session for this telegram user
  let session = await prisma.chatSession.findFirst({
    where: { tenantId, externalUserId },
    orderBy: { startedAt: "desc" },
  });

  // Create new session if none exists or last message was >1 hour ago
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (!session || (session.lastMessageAt && session.lastMessageAt < oneHourAgo)) {
    session = await prisma.chatSession.create({
      data: {
        tenantId,
        externalUserId,
        metadata: {
          channel: "telegram",
          telegramChatId: chatId,
          userName: `${msg.from.first_name}${msg.from.last_name ? " " + msg.from.last_name : ""}`,
          username: msg.from.username || "",
        },
      },
    });
  }

  // Send typing indicator
  await sendTelegramTyping(config.botToken, chatId);

  // Process through AI
  const orchestrator = new AIOrchestrator(tenantId);
  const result = await orchestrator.processMessage(session.id, userText);

  // Send response
  if (result.type === "text" || result.type === "error") {
    await sendTelegramMessage(config.botToken, chatId, result.content);
  } else if (result.type === "confirmation_required") {
    await sendTelegramMessage(
      config.botToken,
      chatId,
      `${result.content}\n\n⚠️ *Action Required:* ${result.confirmation?.summary}\n\nReply "yes" to confirm or "no" to cancel.`
    );
  }
}
