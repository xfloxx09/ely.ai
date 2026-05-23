import { Plan } from "@prisma/client";
import { db } from "@/lib/db";
import { todayKey } from "@/lib/utils";

const FREE_DAILY_LIMIT = 10;

export async function checkAndIncrementUsage(
  userId: string,
  plan: Plan
): Promise<{ allowed: boolean; remaining: number | null }> {
  if (plan === "PLUS" || plan === "PRO") {
    return { allowed: true, remaining: null };
  }

  const date = todayKey();
  const usage = await db.aiUsage.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, messageCount: 0 },
    update: {},
  });

  if (usage.messageCount >= FREE_DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  await db.aiUsage.update({
    where: { userId_date: { userId, date } },
    data: { messageCount: { increment: 1 } },
  });

  return {
    allowed: true,
    remaining: FREE_DAILY_LIMIT - usage.messageCount - 1,
  };
}

export async function incrementDailyQuest(userId: string) {
  const today = todayKey();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lastQuestDate: true, dailyTaskCount: true, streak: true },
  });

  if (!user) return;

  let streak = user.streak;
  let dailyTaskCount = user.dailyTaskCount;

  if (user.lastQuestDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);
    streak = user.lastQuestDate === yesterdayKey ? user.streak + 1 : 1;
    dailyTaskCount = 0;
  }

  dailyTaskCount += 1;
  const xpGain = dailyTaskCount <= 3 ? 10 : 0;

  await db.user.update({
    where: { id: userId },
    data: {
      lastQuestDate: today,
      dailyTaskCount,
      streak,
      xp: { increment: xpGain },
    },
  });
}
