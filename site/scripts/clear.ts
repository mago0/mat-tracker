/**
 * Clear all data from the mat-tracker database
 *
 * Run with: npx tsx scripts/clear.ts
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/lib/db/schema";

const dbPath = process.env.DATABASE_PATH || "./data/mat-tracker.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
const db = drizzle(sqlite, { schema });

async function clear() {
  console.log("🗑️  Clearing mat-tracker database...\n");

  db.delete(schema.attendance).run();
  console.log("  ✓ Cleared attendance records");

  db.delete(schema.promotions).run();
  console.log("  ✓ Cleared promotions");

  db.delete(schema.notes).run();
  console.log("  ✓ Cleared notes");

  db.delete(schema.students).run();
  console.log("  ✓ Cleared students");

  console.log("\n✅ Database cleared!");
}

clear().catch(console.error);
