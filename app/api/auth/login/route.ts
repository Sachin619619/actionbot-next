import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { email } });
    if (!tenant) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, tenant.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createToken(tenant.id);

    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      tenant: {
        id: tenant.id, name: tenant.name, email: tenant.email,
        plan: tenant.plan, apiKey: tenant.apiKey, isActive: tenant.isActive, createdAt: tenant.createdAt,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
