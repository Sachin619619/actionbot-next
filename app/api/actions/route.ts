import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const actions = await prisma.action.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(actions);
}

export async function POST(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, webhookUrl, headers, bodyTemplate, enabled } = await request.json();

  if (!name || !description || !webhookUrl) {
    return NextResponse.json({ error: "name, description, and webhookUrl are required" }, { status: 400 });
  }

  const action = await prisma.action.create({
    data: {
      tenantId: tenant.id,
      name,
      description,
      webhookUrl,
      headers: headers || null,
      bodyTemplate: bodyTemplate || null,
      enabled: enabled !== undefined ? enabled : true,
    },
  });

  return NextResponse.json(action, { status: 201 });
}
