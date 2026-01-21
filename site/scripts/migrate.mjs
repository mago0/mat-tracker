import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DATABASE_PATH || "./data/mat-tracker.db";

console.log(`Running migrations on database: ${dbPath}`);

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

const db = drizzle(sqlite);

migrate(db, { migrationsFolder: join(__dirname, "../drizzle") });

console.log("Migrations completed successfully");

sqlite.close();
