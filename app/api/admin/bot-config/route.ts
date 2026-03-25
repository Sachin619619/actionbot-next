import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = await prisma.botConfig.findUnique({ where: { tenantId: tenant.id } });
  if (!config) return NextResponse.json({ error: "Bot config not found" }, { status: 404 });

  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, avatarUrl, systemPrompt, personality, welcomeMessage, model, maxTokens, quickReplies, themeColor, darkMode } = await request.json();

  const config = await prisma.botConfig.update({
    where: { tenantId: tenant.id },
    data: {
      ...(name !== undefined && { name }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(systemPrompt !== undefined && { systemPrompt }),
      ...(personality !== undefined && { personality }),
      ...(welcomeMessage !== undefined && { welcomeMessage }),
      ...(model !== undefined && { model }),
      ...(maxTokens !== undefined && { maxTokens }),
      ...(quickReplies !== undefined && { quickReplies }),
      ...(themeColor !== undefined && { themeColor }),
      ...(darkMode !== undefined && { darkMode }),
    },
  });

  return NextResponse.json(config);
}
