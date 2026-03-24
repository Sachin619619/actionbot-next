import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    const existing = await prisma.tenant.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const apiKey = crypto.randomBytes(32).toString("hex");

    const tenant = await prisma.tenant.create({
      data: {
        name, email, passwordHash, apiKey,
        botConfig: {
          create: {
            name: `${name} Assistant`,
            systemPrompt: `You are ${name}'s AI assistant. Help users with their requests using the available tools. Be concise and helpful.`,
            welcomeMessage: `Hi! I'm ${name}'s assistant. How can I help you today?`,
          },
        },
      },
      include: { botConfig: true },
    });

    const token = await createToken(tenant.id);

    return NextResponse.json({
      access_token: token,
      token_type: "bearer",
      tenant: {
        id: tenant.id, name: tenant.name, email: tenant.email,
        plan: tenant.plan, apiKey: tenant.apiKey, isActive: tenant.isActive, createdAt: tenant.createdAt,
      },
    }, { status: 201 });
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
