import { prisma } from "@/lib/db";
import { AIOrchestrator } from "@/lib/ai/orchestrator";

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  verifyToken: string;
}

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: { body: string };
  type: string;
}

export async function sendWhatsAppMessage(config: WhatsAppConfig, to: string, text: string) {
  const res = await fetch(`https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text },
    }),
  });
  return res.json();
}

export async function markWhatsAppRead(config: WhatsAppConfig, messageId: string) {
  await fetch(`https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  });
}

export async function processWhatsAppMessage(message: WhatsAppMessage, tenantId: string, config: WhatsAppConfig, contactName?: string) {
  if (message.type !== "text" || !message.text?.body) return;

  const from = message.from;
  const userText = message.text.body;
  const externalUserId = `whatsapp_${from}`;

  // Find or create session
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
          channel: "whatsapp",
          phoneNumber: from,
          contactName: contactName || "",
        },
      },
    });
  }

  // Mark as read
  await markWhatsAppRead(config, message.id);

  // Process through AI
  const orchestrator = new AIOrchestrator(tenantId);
  const result = await orchestrator.processMessage(session.id, userText);

  // Send response
  if (result.type === "text" || result.type === "error") {
    await sendWhatsAppMessage(config, from, result.content);
  } else if (result.type === "confirmation_required") {
    await sendWhatsAppMessage(
      config,
      from,
      `${result.content}\n\n⚠️ Action Required: ${result.confirmation?.summary}\n\nReply "yes" to confirm or "no" to cancel.`
    );
  }
}
