import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tools = await prisma.tool.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tools);
}

export async function POST(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, inputSchema, endpointUrl, httpMethod, headers, authConfig, isSensitive, timeoutSeconds } = await request.json();

  if (!name || !description || !inputSchema || !endpointUrl) {
    return NextResponse.json({ error: "name, description, inputSchema, and endpointUrl are required" }, { status: 400 });
  }

  const tool = await prisma.tool.create({
    data: {
      tenantId: tenant.id, name, description, inputSchema, endpointUrl,
      httpMethod: httpMethod || "POST", headers: headers || {}, authConfig: authConfig || null,
      isSensitive: isSensitive || false, timeoutSeconds: timeoutSeconds || 30,
    },
  });

  return NextResponse.json(tool, { status: 201 });
}
