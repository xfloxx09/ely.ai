import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      passwordHash: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  console.log(`Total users: ${users.length}`);
  for (const u of users) {
    console.log(
      `- ${u.email} | ${u.role} | hasPassword=${!!u.passwordHash} | ${u.createdAt.toISOString()}`
    );
  }
}

main().finally(() => db.$disconnect());
