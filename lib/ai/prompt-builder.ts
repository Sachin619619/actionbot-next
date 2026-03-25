import type { BotConfig, Tool, KnowledgeBase, Message, Action } from "@prisma/client";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

export function buildSystemPrompt(botConfig: BotConfig, knowledge: KnowledgeBase[], sessionMetadata?: Record<string, any>, actions?: Action[]): string {
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

  if (actions && actions.length > 0) {
    parts.push("\n\n## Available Actions (Webhooks)");
    parts.push("You can trigger the following actions. Each action calls an external webhook. Use the corresponding tool function (prefixed with 'action_') to execute them.");
    for (const action of actions) {
      parts.push(`- **action_${action.name}**: ${action.description}`);
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

export function buildActionTools(actions: Action[]): ChatCompletionTool[] {
  return actions.filter((a) => a.enabled).map((a) => ({
    type: "function" as const,
    function: {
      name: `action_${a.name}`,
      description: a.description,
      parameters: {
        type: "object" as const,
        properties: buildActionParameters(a.bodyTemplate as Record<string, any> | null),
      },
    },
  }));
}

function buildActionParameters(bodyTemplate: Record<string, any> | null): Record<string, any> {
  if (!bodyTemplate) {
    return {
      data: { type: "object", description: "Data to send with the action" },
    };
  }

  const props: Record<string, any> = {};
  extractTemplatePlaceholders(bodyTemplate, props);

  if (Object.keys(props).length === 0) {
    props.data = { type: "object", description: "Data to send with the action" };
  }

  return props;
}

function extractTemplatePlaceholders(template: Record<string, any>, props: Record<string, any>) {
  for (const value of Object.values(template)) {
    if (typeof value === "string") {
      const matches = value.matchAll(/\{\{(\w+)\}\}/g);
      for (const match of matches) {
        props[match[1]] = { type: "string", description: `Value for ${match[1]}` };
      }
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      extractTemplatePlaceholders(value, props);
    }
  }
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
