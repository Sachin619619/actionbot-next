import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./db";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "change-me");

export async function createToken(tenantId: string): Promise<string> {
  return new SignJWT({ sub: tenantId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.sub as string) || null;
  } catch {
    return null;
  }
}

export async function getAuthTenant(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const tenantId = await verifyToken(token);
  if (!tenantId) return null;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || !tenant.isActive) return null;

  return tenant;
}

export async function getApiKeyTenant(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) return null;

  const tenant = await prisma.tenant.findUnique({ where: { apiKey } });
  if (!tenant || !tenant.isActive) return null;

  return tenant;
}
