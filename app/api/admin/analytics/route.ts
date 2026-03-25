import { NextResponse } from "next/server";
import { getAuthTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const tenant = await getAuthTenant(request);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const tenantFilter = { tenantId: tenant.id };
  const sessionTenantFilter = { session: { tenantId: tenant.id } };

  const [
    sessionsToday,
    sessionsThisWeek,
    sessionsThisMonth,
    sessionsAllTime,
    totalMessagesSent,
    totalMessagesReceived,
    totalMessages,
    uniqueUsers,
    allMessages,
    firstUserMessages,
  ] = await Promise.all([
    prisma.chatSession.count({ where: { ...tenantFilter, startedAt: { gte: startOfToday } } }),
    prisma.chatSession.count({ where: { ...tenantFilter, startedAt: { gte: startOfWeek } } }),
    prisma.chatSession.count({ where: { ...tenantFilter, startedAt: { gte: startOfMonth } } }),
    prisma.chatSession.count({ where: tenantFilter }),
    prisma.message.count({ where: { ...sessionTenantFilter, role: "user" } }),
    prisma.message.count({ where: { ...sessionTenantFilter, role: "assistant" } }),
    prisma.message.count({ where: sessionTenantFilter }),
    prisma.chatSession.findMany({
      where: { ...tenantFilter, externalUserId: { not: null } },
      select: { externalUserId: true },
      distinct: ["externalUserId"],
    }),
    prisma.message.findMany({
      where: sessionTenantFilter,
      select: { createdAt: true },
    }),
    prisma.chatSession.findMany({
      where: tenantFilter,
      select: {
        messages: {
          where: { role: "user" },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { content: true },
        },
      },
    }),
  ]);

  const avgMessagesPerSession = sessionsAllTime > 0
    ? Math.round((totalMessages / sessionsAllTime) * 100) / 100
    : 0;

  const hourlyDistribution = new Array(24).fill(0);
  for (const msg of allMessages) {
    const hour = msg.createdAt.getHours();
    hourlyDistribution[hour]++;
  }
  const mostActiveHours = hourlyDistribution.map((count, hour) => ({ hour, count }));

  const firstMessages: string[] = [];
  for (const session of firstUserMessages) {
    if (session.messages.length > 0 && session.messages[0].content) {
      firstMessages.push(session.messages[0].content);
    }
  }

  const topicCounts = new Map<string, { original: string; count: number }>();
  for (const msg of firstMessages) {
    const key = msg.trim().toLowerCase();
    const existing = topicCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      topicCounts.set(key, { original: msg.trim(), count: 1 });
    }
  }

  const popularFirstMessages = Array.from(topicCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(({ original, count }) => ({ message: original, count }));

  return NextResponse.json({
    sessions: {
      today: sessionsToday,
      thisWeek: sessionsThisWeek,
      thisMonth: sessionsThisMonth,
      allTime: sessionsAllTime,
    },
    messages: {
      sent: totalMessagesSent,
      received: totalMessagesReceived,
      total: totalMessages,
    },
    avgMessagesPerSession,
    uniqueUsers: uniqueUsers.length,
    mostActiveHours,
    popularFirstMessages,
  });
}
