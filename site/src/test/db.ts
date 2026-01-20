import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";

/**
 * Create an in-memory test database with schema applied
 */
export function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("journal_mode = WAL");

  // Create tables
  sqlite.exec(`
    CREATE TABLE students (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      start_date TEXT NOT NULL,
      current_belt TEXT NOT NULL DEFAULT 'white',
      current_stripes INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      date TEXT NOT NULL,
      class_type TEXT NOT NULL DEFAULT 'gi',
      created_at TEXT NOT NULL
    );

    CREATE TABLE promotions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      from_belt TEXT NOT NULL,
      from_stripes INTEGER NOT NULL,
      to_belt TEXT NOT NULL,
      to_stripes INTEGER NOT NULL,
      promoted_at TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE notes (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES students(id),
      category TEXT NOT NULL DEFAULT 'general',
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return drizzle(sqlite, { schema });
}

/**
 * Create a test student
 */
export function createTestStudent(db: ReturnType<typeof createTestDb>, overrides = {}) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const student = {
    id,
    firstName: "Test",
    lastName: "Student",
    email: "test@example.com",
    phone: "555-1234",
    emergencyContact: "Parent",
    emergencyPhone: "555-5678",
    startDate: "2024-01-01",
    currentBelt: "white" as const,
    currentStripes: 0,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };

  db.insert(schema.students).values(student).run();
  return student;
}
