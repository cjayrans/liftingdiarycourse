import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Create Neon client
const sql = neon(process.env.DATABASE_URL!);

// Create Drizzle instance
export const db = drizzle(sql, { schema });

// Export schema types for convenience
export * from "./schema";
