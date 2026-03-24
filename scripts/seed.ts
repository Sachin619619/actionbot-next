import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding demo data...");

  const existing = await prisma.tenant.findUnique({ where: { email: "demo@actionbot.com" } });
  if (existing) {
    await prisma.tenant.delete({ where: { id: existing.id } });
    console.log("  Cleaned existing demo tenant");
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: "FoodBot Demo",
      email: "demo@actionbot.com",
      passwordHash: await bcrypt.hash("demo123", 12),
      apiKey: "demo-" + crypto.randomBytes(16).toString("hex"),
      plan: "pro",
    },
  });
  console.log(`  ✅ Created tenant: ${tenant.name} (${tenant.email})`);
  console.log(`  🔑 API Key: ${tenant.apiKey}`);

  await prisma.botConfig.create({
    data: {
      tenantId: tenant.id,
      name: "FoodBot",
      systemPrompt: `You are FoodBot, a friendly and efficient food ordering assistant for restaurants in Bangalore, India.\n\nYour capabilities:\n- Search restaurants by cuisine, budget, or location\n- Show restaurant menus\n- Add items to cart\n- Place orders (requires user confirmation)\n- Track order status\n- Cancel orders (requires user confirmation)\n\nGuidelines:\n- Always be helpful and suggest options when the user is unsure\n- Use Indian Rupees (₹) for prices\n- When showing restaurants or menus, format them nicely\n- Before placing an order, summarize the cart and confirm the delivery address\n- Be conversational and friendly, like a helpful friend recommending food`,
      personality: "friendly",
      welcomeMessage: "Namaste! 🍛 I'm FoodBot — your personal food ordering assistant! I can help you find restaurants, browse menus, and place orders. What are you in the mood for today?",
      model: "MiniMax-M2.7-highspeed",
      maxTokens: 1024,
    },
  });
  console.log("  ✅ Created bot config");

  const tools = [
    { name: "search_restaurants", description: "Search for restaurants by cuisine type, budget range, or location/area in Bangalore", inputSchema: { type: "object", properties: { cuisine: { type: "string", description: "Type of cuisine" }, budget: { type: "string", description: "Maximum budget per person" }, location: { type: "string", description: "Area/location in Bangalore" } } }, endpointUrl: "internal://food/search_restaurants", isSensitive: false },
    { name: "get_menu", description: "Get the full menu of a specific restaurant", inputSchema: { type: "object", properties: { restaurant_id: { type: "string", description: "The restaurant ID" } }, required: ["restaurant_id"] }, endpointUrl: "internal://food/get_menu", isSensitive: false },
    { name: "add_to_cart", description: "Add food items to the shopping cart", inputSchema: { type: "object", properties: { restaurant_id: { type: "string" }, items: { type: "array", items: { type: "object", properties: { item_id: { type: "string" }, name: { type: "string" }, price: { type: "number" }, quantity: { type: "number", default: 1 } }, required: ["item_id", "name", "price"] } }, cart_id: { type: "string" } }, required: ["restaurant_id", "items"] }, endpointUrl: "internal://food/add_to_cart", isSensitive: false },
    { name: "place_order", description: "Place the final order with items in the cart", inputSchema: { type: "object", properties: { cart_id: { type: "string" }, address: { type: "string" } }, required: ["cart_id", "address"] }, endpointUrl: "internal://food/place_order", isSensitive: true },
    { name: "track_order", description: "Track the status of a placed order", inputSchema: { type: "object", properties: { order_id: { type: "string" } }, required: ["order_id"] }, endpointUrl: "internal://food/track_order", isSensitive: false },
    { name: "cancel_order", description: "Cancel a placed order", inputSchema: { type: "object", properties: { order_id: { type: "string" }, reason: { type: "string" } }, required: ["order_id"] }, endpointUrl: "internal://food/cancel_order", isSensitive: true },
  ];

  for (const tool of tools) {
    await prisma.tool.create({ data: { tenantId: tenant.id, ...tool } });
  }
  console.log(`  ✅ Created ${tools.length} tools`);

  const knowledgeItems = [
    { title: "About FoodBot", content: "FoodBot is a food ordering assistant for Bangalore. We partner with 10+ restaurants.", category: "general" },
    { title: "Delivery Policy", content: "Free delivery for orders above ₹200. ₹30 fee for smaller orders. 30-40 min average.", category: "policy" },
    { title: "Refund Policy", content: "Cancel before food is out for delivery. Refunds in 3-5 business days.", category: "policy" },
    { title: "Payment", content: "We accept UPI, cards, and COD. Demo orders are simulated.", category: "faq" },
  ];

  for (const kb of knowledgeItems) {
    await prisma.knowledgeBase.create({ data: { tenantId: tenant.id, ...kb } });
  }
  console.log(`  ✅ Created ${knowledgeItems.length} knowledge base entries`);

  console.log("\n🎉 Demo seed complete!");
  console.log(`\n📋 Demo Credentials:`);
  console.log(`   Email: demo@actionbot.com`);
  console.log(`   Password: demo123`);
  console.log(`   API Key: ${tenant.apiKey}`);
}

seed()
  .catch((err) => { console.error("Seed error:", err); process.exit(1); })
  .finally(() => prisma.$disconnect());
