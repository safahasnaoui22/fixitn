import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.create({
    data: {
      fullName: "Admin",
      phone: "54812998",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin created");
  console.log({
    phone: admin.phone,
    password: "admin123",
    role: admin.role,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());