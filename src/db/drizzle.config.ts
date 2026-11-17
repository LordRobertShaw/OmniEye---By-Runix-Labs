import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.SQL_HOST || "127.0.0.1",
    port: Number(process.env.SQL_PORT || 5432),
    database: process.env.SQL_DB_NAME || "postgres",
    user: process.env.SQL_ADMIN_USER || "postgres",
    password: process.env.SQL_ADMIN_PASSWORD || "",
    ssl: false,
  },
});
