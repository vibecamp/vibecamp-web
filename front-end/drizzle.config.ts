import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DB_URL!,
  },
});
