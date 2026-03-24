import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const tenant = await p.tenant.findUnique({ where: { email: "admin@castleliving.in" } });
  if (!tenant) { console.log("No tenant"); return; }

  const CASTLE_URL = "https://castleliving.in";
  const BOT_SECRET = "castle-bot-secret-2026";
  const authHeaders = { "X-Bot-Secret": BOT_SECRET };

  const newTools = [
    {
      name: "update_profile",
      description: "Update the user's profile on Castle Living. Can change name, phone number, or username. Requires user email to identify them.",
      inputSchema: {
        type: "object",
        properties: {
          userEmail: { type: "string", description: "User's email address (to identify them)" },
          name: { type: "string", description: "New name (optional)" },
          phone: { type: "string", description: "New phone number (optional)" },
          username: { type: "string", description: "New username/handle (optional, lowercase)" },
        },
        required: ["userEmail"],
      },
      endpointUrl: `${CASTLE_URL}/api/bot/update-profile`,
      httpMethod: "POST",
      headers: authHeaders,
      isSensitive: true,
      timeoutSeconds: 10,
    },
    {
      name: "get_profile",
      description: "Get the user's full profile details including stay requests, bookings, and reviews from Castle Living.",
      inputSchema: {
        type: "object",
        properties: {
          userEmail: { type: "string", description: "User's email address" },
        },
        required: ["userEmail"],
      },
      endpointUrl: `${CASTLE_URL}/api/bot/get-profile`,
      httpMethod: "POST",
      headers: authHeaders,
      isSensitive: false,
      timeoutSeconds: 10,
    },
    {
      name: "cancel_request",
      description: "Cancel a pending stay request or booking for the user.",
      inputSchema: {
        type: "object",
        properties: {
          userEmail: { type: "string", description: "User's email address" },
          pgName: { type: "string", description: "Name of the PG to cancel (optional, cancels most recent if not specified)" },
          requestType: { type: "string", description: "Type of request: stay or booking (default: stay)" },
        },
        required: ["userEmail"],
      },
      endpointUrl: `${CASTLE_URL}/api/bot/cancel-request`,
      httpMethod: "POST",
      headers: authHeaders,
      isSensitive: true,
      timeoutSeconds: 10,
    },
    {
      name: "write_review",
      description: "Write or update a review for a PG on behalf of the user.",
      inputSchema: {
        type: "object",
        properties: {
          userEmail: { type: "string", description: "User's email address" },
          userName: { type: "string", description: "User's display name" },
          pgName: { type: "string", description: "Name of the PG to review" },
          rating: { type: "number", description: "Rating from 1 to 5 stars" },
          comment: { type: "string", description: "Review text/comment" },
        },
        required: ["userEmail", "pgName", "rating"],
      },
      endpointUrl: `${CASTLE_URL}/api/bot/write-review`,
      httpMethod: "POST",
      headers: authHeaders,
      isSensitive: true,
      timeoutSeconds: 10,
    },
    {
      name: "make_booking",
      description: "Create a formal booking for a PG with move-in date, room type, and duration.",
      inputSchema: {
        type: "object",
        properties: {
          userEmail: { type: "string", description: "User's email address" },
          userName: { type: "string", description: "User's name" },
          userPhone: { type: "string", description: "User's phone (optional)" },
          pgName: { type: "string", description: "Name of the PG to book" },
          moveInDate: { type: "string", description: "Desired move-in date (YYYY-MM-DD)" },
          roomType: { type: "string", description: "Room type: single, double, or triple" },
          durationMonths: { type: "number", description: "Duration in months (default: 1)" },
          notes: { type: "string", description: "Any special requests or notes" },
        },
        required: ["userEmail", "userName", "pgName"],
      },
      endpointUrl: `${CASTLE_URL}/api/bot/make-booking`,
      httpMethod: "POST",
      headers: authHeaders,
      isSensitive: true,
      timeoutSeconds: 10,
    },
  ];

  for (const tool of newTools) {
    const existing = await p.tool.findFirst({ where: { tenantId: tenant.id, name: tool.name } });
    if (existing) await p.tool.delete({ where: { id: existing.id } });
    await p.tool.create({ data: { tenantId: tenant.id, ...tool } });
    console.log("  " + tool.name);
  }

  // Update system prompt
  const cfg = await p.botConfig.findFirst({ where: { tenantId: tenant.id } });
  if (cfg) {
    let prompt = cfg.systemPrompt;
    // Remove old navigation-only section
    prompt = prompt.replace(/\nIMPORTANT - Page Navigation:[\s\S]*Do NOT just paste the link .* navigate_page tool so the page opens automatically\./, "");

    const extra = `

IMPORTANT - Full Account Management:
You can perform ALL account actions for users. When a user asks to do something, USE THE TOOLS.

Available account tools:
- update_profile: Change name, phone, username (requires userEmail)
- get_profile: View full profile with requests, bookings, reviews
- cancel_request: Cancel pending stay requests or bookings
- write_review: Write/update PG reviews (1-5 stars + comment)
- make_booking: Create formal bookings with move-in date, room type, duration
- navigate_page: Open pages (profile, saved, etc.) in new tab

Always ask for the user email first if you do not have it. Once you have it, use it for all subsequent tool calls. For sensitive actions (update_profile, cancel_request, write_review, make_booking), the user will be asked to confirm before execution.

When a user says "change my number" or "update my name", USE the update_profile tool. Do NOT say you cannot do it.`;

    if (!prompt.includes("Full Account Management")) {
      prompt += extra;
    }

    await p.botConfig.update({ where: { id: cfg.id }, data: { systemPrompt: prompt } });
    console.log("  Updated system prompt");
  }

  const count = await p.tool.count({ where: { tenantId: tenant.id } });
  console.log(`\nTotal tools: ${count}`);
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
