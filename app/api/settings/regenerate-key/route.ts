import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const newApiKey = `ab_${randomUUID().replace(/-/g, "")}`;

  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: { apiKey: newApiKey },
  });

  // Log the key regeneration
  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      action: "api_key_regenerated",
      details: { previousKeyPrefix: tenant.apiKey.slice(0, 8) + "..." },
    },
  });

  return NextResponse.json({ apiKey: updated.apiKey });
}
