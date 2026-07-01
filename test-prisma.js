const { PrismaClient } = require("@prisma/client");

try {
  const prisma = new PrismaClient({});
  console.log("created");
} catch (e) {
  console.error(e);
}