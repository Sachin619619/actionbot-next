import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function seed() {
  console.log("🍕 Seeding FreshBite demo tenant...");

  // Clean existing
  const existing = await prisma.tenant.findUnique({ where: { email: "demo@freshbite.app" } });
  if (existing) {
    await prisma.tenant.delete({ where: { id: existing.id } });
    console.log("  Cleaned existing FreshBite tenant");
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: "FreshBite",
      email: "demo@freshbite.app",
      passwordHash: await bcrypt.hash("freshbite2026", 12),
      apiKey: "freshbite-" + crypto.randomBytes(16).toString("hex"),
      plan: "pro",
    },
  });
  console.log(`  ✅ Created tenant: ${tenant.name}`);
  console.log(`  🔑 API Key: ${tenant.apiKey}`);

  // Bot Config
  await prisma.botConfig.create({
    data: {
      tenantId: tenant.id,
      name: "FreshBite AI",
      systemPrompt: `You are FreshBite AI, a friendly food ordering assistant for FreshBite — a food delivery platform.

You help customers with:
- Browsing the menu and recommending dishes
- Answering questions about ingredients, spice levels, and dietary info
- Helping with order tracking and delivery estimates
- Suggesting combos and deals

Menu Highlights:
- Margherita Pizza — ₹299, classic thin crust, fresh mozzarella & basil (⭐ 4.9)
- Butter Chicken — ₹349, creamy tomato gravy with naan (⭐ 4.8)
- Caesar Salad Bowl — ₹199, crispy romaine, parmesan, croutons (⭐ 4.7)
- Smash Burger — ₹249, double patty, cheddar, pickles, special sauce (⭐ 4.9)
- Chicken Biryani — ₹279, Hyderabadi dum biryani with raita (⭐ 4.8)
- Tiramisu — ₹179, classic Italian dessert (⭐ 4.9)
- Paneer Tikka Wrap — ₹199, grilled paneer with mint chutney (⭐ 4.6)
- Pasta Alfredo — ₹269, creamy white sauce with mushrooms (⭐ 4.7)

Guidelines:
- Be cheerful, use food emojis naturally 🍕🍔🥗
- Average delivery time is 18 minutes
- No hidden fees — what you see is what you pay
- Suggest combos: any main + dessert = 10% off
- Keep responses short and appetizing
- If someone asks about allergens, mention we can customize
- 50+ partner restaurants available`,
      welcomeMessage: "Hey! 🍕 I'm FreshBite AI — your food ordering assistant! Browse our menu, get recommendations, or ask me anything about our dishes. What are you craving today?",
    },
  });
  console.log("  ✅ Created bot config");

  console.log("\n🎉 FreshBite demo tenant ready!");
  console.log(`\n📋 Use this in your widget script tag:`);
  console.log(`   data-tenant="${tenant.apiKey}"`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
