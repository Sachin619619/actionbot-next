import type { BotConfig, Tool, KnowledgeBase, Message } from "@prisma/client";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

export function buildSystemPrompt(botConfig: BotConfig, knowledge: KnowledgeBase[], sessionMetadata?: Record<string, any>): string {
  const parts: string[] = [botConfig.systemPrompt];

  if (knowledge.length > 0) {
    parts.push("\n\n## Knowledge Base");
    for (const kb of knowledge) {
      parts.push(`\n### ${kb.title}\n${kb.content}`);
    }
  }

  if (sessionMetadata && Object.keys(sessionMetadata).length > 0) {
    parts.push("\n\n## Current User Context");
    if (sessionMetadata.authenticatedEmail) {
      parts.push(`- Authenticated Email: ${sessionMetadata.authenticatedEmail}`);
      parts.push(`- Authenticated Name: ${sessionMetadata.authenticatedName || ""}`);
      parts.push("SECURITY: This user is logged in. Use ONLY this email for all account tools (update_profile, get_profile, cancel_request, write_review, make_booking). Do NOT use any other email the user provides for these actions. If the user asks to modify another account, politely decline.");
    }
    if (sessionMetadata.name) parts.push(`- Name: ${sessionMetadata.name}`);
    if (sessionMetadata.email) parts.push(`- Email: ${sessionMetadata.email}`);
    if (sessionMetadata.phone) parts.push(`- Phone: ${sessionMetadata.phone}`);
    if (sessionMetadata.userId) parts.push(`- User ID: ${sessionMetadata.userId}`);
    for (const [key, value] of Object.entries(sessionMetadata)) {
      if (!["name", "email", "phone", "userId", "authenticatedEmail", "authenticatedName"].includes(key) && value) {
        parts.push(`- ${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`);
      }
    }
  }

  parts.push("\n\n## Instructions");
  parts.push("- Use the available tools to help the user accomplish tasks.");
  parts.push("- When calling a sensitive tool, explain what you're about to do before executing.");
  parts.push("- If a tool returns an error, inform the user clearly and suggest alternatives.");
  parts.push("- Be concise, helpful, and action-oriented.");
  parts.push("- Never make up data — only use information from tool results.");

  return parts.join("\n");
}

export function buildTools(tools: Tool[]): ChatCompletionTool[] {
  return tools.filter((t) => t.isActive).map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.inputSchema as any },
  }));
}

export function buildMessageHistory(messages: Message[]): ChatCompletionMessageParam[] {
  const result: ChatCompletionMessageParam[] = [];

  for (const msg of messages) {
    if (msg.role === "user") {
      result.push({ role: "user", content: msg.content || "" });
    } else if (msg.role === "assistant") {
      const assistantMsg: any = { role: "assistant" };
      if (msg.content) assistantMsg.content = msg.content;
      if (msg.toolCall) {
        const tc = msg.toolCall as any;
        assistantMsg.tool_calls = [{
          id: tc.callId, type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.input) },
        }];
      }
      result.push(assistantMsg);
    } else if (msg.role === "tool_result") {
      const tr = msg.toolResult as any;
      result.push({ role: "tool", tool_call_id: tr.callId, content: JSON.stringify(tr.output) } as any);
    }
  }

  return result;
}
