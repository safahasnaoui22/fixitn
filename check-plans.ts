import "dotenv/config";
import { prisma } from "./src/lib/db/client";

async function main() {
  const plans = await prisma.plan.findMany({
    select: {
      id: true,
      key: true,
      name: true,
    },
    orderBy: {
      key: "asc",
    },
  });

  console.log(plans);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
