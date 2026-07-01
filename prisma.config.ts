import { defineConfig } from 'prisma/config'
import 'dotenv/config'  // This loads .env file

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,  // URL is ONLY here, not in schema
  },
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
})