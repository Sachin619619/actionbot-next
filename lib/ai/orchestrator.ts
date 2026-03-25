import OpenAI from "openai";
import { prisma } from "@/lib/db";
import { buildSystemPrompt, buildTools, buildActionTools, buildMessageHistory } from "./prompt-builder";
import { executeTool, executeAction } from "./tool-executor";
import type { Tool, Action } from "@prisma/client";

function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>\s*/g, "").trim();
}

const openai = new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
  baseURL: process.env.ANTHROPIC_BASE_URL || "https://api.minimax.io/v1",
});

export interface OrchestratorResult {
  type: "text" | "confirmation_required" | "error";
  content: string;
  confirmation?: {
    id: string;
    toolName: string;
    params: Record<string, any>;
    summary: string;
  };
  attachments?: Array<{type: string; data: Record<string, any>}>;
}

export class AIOrchestrator {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  async processMessage(sessionId: string, userMessage: string): Promise<OrchestratorResult> {
    const [botConfig, tools, actions, knowledge, history, session] = await Promise.all([
      prisma.botConfig.findUnique({ where: { tenantId: this.tenantId } }),
      prisma.tool.findMany({ where: { tenantId: this.tenantId, isActive: true } }),
      prisma.action.findMany({ where: { tenantId: this.tenantId, enabled: true } }),
      prisma.knowledgeBase.findMany({ where: { tenantId: this.tenantId, isActive: true } }),
      prisma.message.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" }, take: 40 }),
      prisma.chatSession.findUnique({ where: { id: sessionId } }),
    ]);

    if (!botConfig) {
      return { type: "error", content: "Bot not configured. Please set up your bot first." };
    }

    await prisma.message.create({ data: { sessionId, role: "user", content: userMessage } });
    await prisma.chatSession.update({ where: { id: sessionId }, data: { lastMessageAt: new Date() } });

    const sessionMetadata = (session?.metadata as Record<string, any>) || undefined;
    const systemPrompt = buildSystemPrompt(botConfig, knowledge, sessionMetadata, actions);
    const openaiTools = [...buildTools(tools), ...buildActionTools(actions)];
    const messages = buildMessageHistory(history);
    messages.push({ role: "user", content: userMessage });

    const MAX_ITERATIONS = 5;
    let pendingAttachments: Array<{type: string; data: Record<string, any>}> = [];

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await openai.chat.completions.create({
        model: botConfig.model || process.env.AI_MODEL || "MiniMax-M2.5",
        max_tokens: botConfig.maxTokens,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        ...(openaiTools.length > 0 ? { tools: openaiTools, tool_choice: "auto" } : {}),
      });

      const choice = response.choices[0];
      if (!choice) return { type: "error", content: "No response from AI." };

      const assistantMessage = choice.message;
      const textContent = stripThinkTags(assistantMessage.content || "");
      const toolCalls = assistantMessage.tool_calls;

      if (!toolCalls || toolCalls.length === 0) {
        await prisma.message.create({ data: { sessionId, role: "assistant", content: textContent } });
        return { type: "text", content: textContent, ...(pendingAttachments.length > 0 ? { attachments: pendingAttachments } : {}) };
      }

      const toolCall = toolCalls[0] as any;
      const toolDb = tools.find((t) => t.name === toolCall.function.name);
      const actionDb = !toolDb ? actions.find((a) => `action_${a.name}` === toolCall.function.name) : null;

      if (!toolDb && !actionDb) {
        messages.push({ role: "assistant", content: textContent || null, tool_calls: toolCalls } as any);
        messages.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify({ error: `Tool "${toolCall.function.name}" not found` }) } as any);
        continue;
      }

      let toolInput: Record<string, any>;
      try { toolInput = JSON.parse(toolCall.function.arguments); } catch { toolInput = {}; }

      // Handle action execution (webhook-based actions)
      if (actionDb) {
        await prisma.message.create({
          data: {
            sessionId, role: "assistant", content: textContent || null,
            toolCall: { callId: toolCall.id, name: toolCall.function.name, input: toolInput },
          },
        });

        const { output, isError } = await executeAction(actionDb, toolInput);

        await prisma.message.create({
          data: { sessionId, role: "tool_result", toolResult: { callId: toolCall.id, output, isError } },
        });

        messages.push({ role: "assistant", content: textContent || null, tool_calls: toolCalls } as any);
        messages.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(output) } as any);
        continue;
      }

      if (toolDb!.isSensitive) {
        const assistantMsg = await prisma.message.create({
          data: {
            sessionId, role: "assistant", content: textContent || null,
            toolCall: { callId: toolCall.id, name: toolCall.function.name, input: toolInput, toolId: toolDb!.id },
          },
        });

        const summary = this.buildActionSummary(toolDb!, toolInput);
        const confirmation = await prisma.confirmation.create({
          data: {
            messageId: assistantMsg.id, sessionId, toolId: toolDb!.id, toolName: toolDb!.name,
            params: toolInput, summary, status: "pending",
          },
        });

        return {
          type: "confirmation_required",
          content: textContent || `I'd like to execute **${toolDb!.name}**. Please confirm.`,
          confirmation: { id: confirmation.id, toolName: toolDb!.name, params: toolInput, summary },
          ...(pendingAttachments.length > 0 ? { attachments: pendingAttachments } : {}),
        };
      }

      await prisma.message.create({
        data: {
          sessionId, role: "assistant", content: textContent || null,
          toolCall: { callId: toolCall.id, name: toolCall.function.name, input: toolInput },
        },
      });

      const { output, isError } = await executeTool(toolDb!, toolInput);

      if (output && output._cards) {
        pendingAttachments.push(...output._cards);
      }

      await prisma.message.create({
        data: { sessionId, role: "tool_result", toolResult: { callId: toolCall.id, output, isError } },
      });

      messages.push({ role: "assistant", content: textContent || null, tool_calls: toolCalls } as any);
      messages.push({ role: "tool", tool_call_id: toolCall.id, content: JSON.stringify(output) } as any);
    }

    return { type: "error", content: "Maximum tool iterations reached. Please try again." };
  }

  async handleConfirmation(confirmationId: string, action: "confirm" | "reject"): Promise<OrchestratorResult> {
    const confirmation = await prisma.confirmation.findUnique({
      where: { id: confirmationId },
      include: { message: true, tool: true },
    });

    if (!confirmation) return { type: "error", content: "Confirmation not found" };
    if (confirmation.status !== "pending") return { type: "error", content: "This action has already been resolved" };

    const toolCallData = confirmation.message.toolCall as any;
    const sessionId = confirmation.sessionId;

    if (action === "reject") {
      await prisma.confirmation.update({
        where: { id: confirmationId },
        data: { status: "rejected", resolvedAt: new Date() },
      });
      await prisma.message.create({
        data: {
          sessionId, role: "tool_result",
          toolResult: { callId: toolCallData.callId, output: { status: "cancelled", reason: "User rejected the action" }, isError: false },
        },
      });
      return this.continueConversation(sessionId);
    }

    await prisma.confirmation.update({
      where: { id: confirmationId },
      data: { status: "confirmed", resolvedAt: new Date() },
    });

    const { output, isError } = await executeTool(confirmation.tool, confirmation.params as any);

    await prisma.message.create({
      data: { sessionId, role: "tool_result", toolResult: { callId: toolCallData.callId, output, isError } },
    });

    return this.continueConversation(sessionId);
  }

  private async continueConversation(sessionId: string): Promise<OrchestratorResult> {
    const [botConfig, tools, actions, knowledge, history, session] = await Promise.all([
      prisma.botConfig.findUnique({ where: { tenantId: this.tenantId } }),
      prisma.tool.findMany({ where: { tenantId: this.tenantId, isActive: true } }),
      prisma.action.findMany({ where: { tenantId: this.tenantId, enabled: true } }),
      prisma.knowledgeBase.findMany({ where: { tenantId: this.tenantId, isActive: true } }),
      prisma.message.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" }, take: 40 }),
      prisma.chatSession.findUnique({ where: { id: sessionId } }),
    ]);

    if (!botConfig) return { type: "error", content: "Bot not configured" };

    const sessionMetadata = (session?.metadata as Record<string, any>) || undefined;
    const systemPrompt = buildSystemPrompt(botConfig, knowledge, sessionMetadata, actions);
    const openaiTools = [...buildTools(tools), ...buildActionTools(actions)];
    const messages = buildMessageHistory(history);

    // Extract attachments from the last tool_result in history
    let pendingAttachments: Array<{type: string; data: Record<string, any>}> = [];
    const lastToolResult = [...history].reverse().find((m) => m.role === "tool_result");
    if (lastToolResult?.toolResult) {
      const tr = lastToolResult.toolResult as any;
      if (tr.output && tr.output._cards) {
        pendingAttachments.push(...tr.output._cards);
      }
    }

    const response = await openai.chat.completions.create({
      model: botConfig.model || process.env.AI_MODEL || "MiniMax-M2.5",
      max_tokens: botConfig.maxTokens,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      ...(openaiTools.length > 0 ? { tools: openaiTools } : {}),
    });

    const text = stripThinkTags(response.choices[0]?.message?.content || "");
    await prisma.message.create({ data: { sessionId, role: "assistant", content: text } });

    return { type: "text", content: text, ...(pendingAttachments.length > 0 ? { attachments: pendingAttachments } : {}) };
  }

  private buildActionSummary(tool: Tool, params: Record<string, any>): string {
    const paramStr = Object.entries(params).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ");
    return `Execute "${tool.name}" with: ${paramStr}`;
  }
}
