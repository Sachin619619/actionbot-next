import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function seed() {
  console.log("🏠 Seeding Castle Living tenant...");

  // Clean existing
  const existing = await prisma.tenant.findUnique({ where: { email: "admin@castleliving.in" } });
  if (existing) {
    await prisma.tenant.delete({ where: { id: existing.id } });
    console.log("  Cleaned existing Castle Living tenant");
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: "Castle Living",
      email: "admin@castleliving.in",
      passwordHash: await bcrypt.hash("castle2026", 12),
      apiKey: "castle-" + crypto.randomBytes(16).toString("hex"),
      plan: "pro",
    },
  });
  console.log(`  ✅ Created tenant: ${tenant.name}`);
  console.log(`  🔑 API Key: ${tenant.apiKey}`);

  // Bot Config
  await prisma.botConfig.create({
    data: {
      tenantId: tenant.id,
      name: "Castle AI",
      systemPrompt: `You are Castle AI, a friendly and knowledgeable PG (Paying Guest) finder assistant for Castle Living — a platform for finding PG accommodations in Bangalore, India.

Your capabilities via tools:
- Search PGs by area, price range, gender preference, room type, and amenities (food, wifi, AC)
- Get detailed information about specific PGs
- Request callbacks from PG owners (requires user confirmation)
- Request stays at PGs (requires user confirmation)
- Set price alerts for specific areas
- Check user's booking/request status

Guidelines:
- Always use the search_pgs tool when user asks about finding PGs
- Use Indian Rupees (₹) for all prices
- Be warm, helpful, and conversational — like a local friend helping find accommodation
- When showing search results, the tool will return rich cards automatically — just add a brief text summary
- For callbacks and stay requests, always confirm with the user first
- If user asks about areas you're unsure of, try searching anyway — the tool handles fuzzy matching
- Popular Bangalore areas: Koramangala, HSR Layout, BTM Layout, Indiranagar, Whitefield, Electronic City, Marathahalli, Bellandur, Sarjapur Road, JP Nagar, Jayanagar, Hebbal, Yelahanka, Banaswadi, Kalyan Nagar

When the user provides their context (name, email, phone), use it when calling tools that need user info (callbacks, stay requests, status checks).`,
      personality: "friendly",
      welcomeMessage: "Hey! 👋 I'm Castle AI — your personal PG finder for Bangalore! I can search PGs, show you options, request callbacks from owners, and more. What are you looking for?",
      model: "MiniMax-M2.7-highspeed",
      maxTokens: 1024,
    },
  });
  console.log("  ✅ Created bot config");

  // Tools - all pointing to Castle Living's bot API endpoints
  // The X-Bot-Secret header is stored per-tool so the tool-executor sends it automatically
  const CASTLE_URL = "https://castleliving.in";
  const BOT_SECRET = process.env.TOOL_AUTH_SECRET || "castle-bot-secret-2026";
  const authHeaders = { "X-Bot-Secret": BOT_SECRET };

  const tools = [
    {
      name: "search_pgs",
      description: "Search for PG accommodations in Bangalore by area, price range, gender, room type, and amenities like food, wifi, AC",
      inputSchema: {
        type: "object",
        properties: {
          area: { type: "string", description: "Area/locality in Bangalore (e.g., Koramangala, HSR Layout, BTM)" },
          maxPrice: { type: "number", description: "Maximum monthly rent in INR" },
          minPrice: { type: "number", description: "Minimum monthly rent in INR" },
          gender: { type: "string", description: "Gender preference: male, female, or coed" },
          type: { type: "string", description: "Room type: single, double, or triple" },
          food: { type: "boolean", description: "Whether food/meals are included" },
          wifi: { type: "boolean", description: "Whether WiFi is available" },
          ac: { type: "boolean", description: "Whether AC rooms are available" },
        },
      },
      endpointUrl: `${CASTLE_URL}/api/bot/search-pgs`,
      httpMethod: "POST",
      headers: authHeaders,
      isSensitive: false,
      timeoutSeconds: 15,
    },
    {
      name: "get_pg_details",
      description: "Get detailed information about a specific PG by name or ID",
      inputSchema: {
        type: "object",
        properties: {
          pgName: { type: "string", description: "Name of the PG" },
          pgId: { type: "string", description: "ID of the PG" },
        },
      },
      endpointUrl: `${CASTLE_URL}/api/bot/pg-details`,
      httpMethod: "POST",
      headers: authHeaders,
      isSensitive: false,
      timeoutSeconds: 10,
    },
    {
      name: "request_callback",
      description: "Request a callback from the PG owner. The owner will call the user back.",
      inputSchema: {
        type: "object",
        properties: {
          pgName: { type: "string", description: "Name of the PG" },
          userName: { type: "string", description: "User's name" },
          userPhone: { type: "string", description: "User's phone number" },
          userEmail: { type: "string", description: "User's email (optional)" },
        },
        required: ["pgName", "userName", "userPhone"],
      },
      endpointUrl: `${CASTLE_URL}/api/bot/request-callback`,
      httpMethod: "POST",
      headers: authHeaders,
      isSensitive: true,
      timeoutSeconds: 10,
    },
    {
      name: "request_stay",
      description: "Send a stay request to a PG. The user wants to move in. Only requires name and email - userId is optional.",
      inputSchema: {
        type: "object",
        properties: {
          pgName: { type: "string", description: "Name of the PG" },
          userName: { type: "string", description: "User's name" },
          userEmail: { type: "string", description: "User's email address" },
        },
        required: ["pgName", "userName", "userEmail"],
      },
      endpointUrl: `${CASTLE_URL}/api/bot/request-stay`,
      httpMethod: "POST",
      headers: authHeaders,
      isSensitive: true,
      timeoutSeconds: 10,
    },
    {
      name: "set_price_alert",
      description: "Set an email alert when PGs in a specific area drop below a price",
      inputSchema: {
        type: "object",
        properties: {
          userEmail: { type: "string", description: "User's email to send alerts to" },
          area: { type: "string", description: "Area in Bangalore" },
          maxPrice: { type: "number", description: "Maximum price threshold in INR" },
        },
        required: ["userEmail", "area", "maxPrice"],
      },
      endpointUrl: `${CASTLE_URL}/api/bot/price-alert`,
      httpMethod: "POST",
      headers: authHeaders,
      isSensitive: false,
      timeoutSeconds: 10,
    },
    {
      name: "check_status",
      description: "Check the user's current PG status, pending stay requests, and callback requests",
      inputSchema: {
        type: "object",
        properties: {
          userId: { type: "string", description: "User's ID" },
        },
        required: ["userId"],
      },
      endpointUrl: `${CASTLE_URL}/api/bot/check-status`,
      httpMethod: "POST",
      headers: authHeaders,
      isSensitive: false,
      timeoutSeconds: 10,
    },
  ];

  for (const tool of tools) {
    await prisma.tool.create({ data: { tenantId: tenant.id, ...tool } });
  }
  console.log(`  ✅ Created ${tools.length} tools`);

  // Knowledge Base
  const knowledge = [
    {
      title: "About Castle Living",
      content: "Castle Living is Bangalore's trusted PG finder platform. We help you find the perfect paying guest accommodation with verified listings, real photos, and transparent pricing. Available areas include Koramangala, HSR Layout, BTM Layout, Indiranagar, Whitefield, Electronic City, Marathahalli, Bellandur, and more.",
      category: "general",
    },
    {
      title: "PG Features & Amenities",
      content: "PGs on Castle Living can include: meals (food), WiFi, AC, laundry, housekeeping, power backup, parking, gym. Room types: single occupancy, double sharing, triple sharing. Gender options: male-only, female-only, co-ed (unisex).",
      category: "features",
    },
    {
      title: "Booking & Stay Process",
      content: "To book a PG: 1) Search and find PGs you like 2) Request a callback from the owner OR request a stay directly 3) Visit the PG for verification 4) Confirm and move in. Callbacks are free and owners typically respond within 24 hours.",
      category: "process",
    },
    {
      title: "Price Ranges in Bangalore",
      content: "Typical PG prices in Bangalore: Budget (₹4,000-₹7,000/mo), Mid-range (₹7,000-₹12,000/mo), Premium (₹12,000-₹20,000/mo). Prices vary by area — Koramangala and Indiranagar tend to be pricier, while Electronic City and Yelahanka are more affordable.",
      category: "pricing",
    },
  ];

  for (const kb of knowledge) {
    await prisma.knowledgeBase.create({ data: { tenantId: tenant.id, ...kb } });
  }
  console.log(`  ✅ Created ${knowledge.length} knowledge base entries`);

  console.log("\n🎉 Castle Living tenant setup complete!");
  console.log(`\n📋 Credentials:`);
  console.log(`   Email: admin@castleliving.in`);
  console.log(`   Password: castle2026`);
  console.log(`   API Key: ${tenant.apiKey}`);
  console.log(`\n🔧 Don't forget to:`);
  console.log(`   1. Update the widget script tag in Castle Living with this API key`);
  console.log(`   2. Add ACTIONBOT_SECRET env var to Castle Living's Vercel`);
}

seed()
  .catch((err) => { console.error("Seed error:", err); process.exit(1); })
  .finally(() => prisma.$disconnect());
