import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const user = await db.user.findUnique({ where: { email: "admin@ely.ai" } });
  if (!user?.passwordHash) {
    console.log("No admin found");
    return;
  }
  const ok = await bcrypt.compare("ElyAdmin!2026", user.passwordHash);
  console.log("Password ElyAdmin!2026 matches:", ok);
}

main().finally(() => db.$disconnect());
