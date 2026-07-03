import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.create({
    data: {
      fullName: "Admin",
      phone: "00000000",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin created successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());