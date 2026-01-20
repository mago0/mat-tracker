import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Belt enum values
export const BELTS = ["white", "blue", "purple", "brown", "black"] as const;
export type Belt = (typeof BELTS)[number];

// Class type enum values
export const CLASS_TYPES = ["gi", "nogi", "open_mat"] as const;
export type ClassType = (typeof CLASS_TYPES)[number];

// Note category enum values
export const NOTE_CATEGORIES = [
  "general",
  "technique",
  "injury",
  "goals",
] as const;
export type NoteCategory = (typeof NOTE_CATEGORIES)[number];

// Students table
export const students = sqliteTable("students", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  startDate: text("start_date").notNull(),
  currentBelt: text("current_belt").$type<Belt>().notNull().default("white"),
  currentStripes: integer("current_stripes").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Attendance table
export const attendance = sqliteTable("attendance", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id),
  date: text("date").notNull(),
  classType: text("class_type").$type<ClassType>().notNull().default("gi"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Promotions table
export const promotions = sqliteTable("promotions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id),
  fromBelt: text("from_belt").$type<Belt>().notNull(),
  fromStripes: integer("from_stripes").notNull(),
  toBelt: text("to_belt").$type<Belt>().notNull(),
  toStripes: integer("to_stripes").notNull(),
  promotedAt: text("promoted_at").notNull(),
  notes: text("notes"),
});

// Notes table
export const notes = sqliteTable("notes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id),
  category: text("category").$type<NoteCategory>().notNull().default("general"),
  content: text("content").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Settings table (key-value store for app configuration)
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(), // JSON string
});

// Type exports for use in application
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Setting = typeof settings.$inferSelect;

// Promotion threshold types
export type StripeThresholds = Record<Belt, number>;
export type BeltThresholds = Partial<Record<Belt, number>>; // No threshold for black belt

export interface PromotionThresholds {
  stripeThresholds: StripeThresholds;
  beltThresholds: BeltThresholds;
}

export const DEFAULT_PROMOTION_THRESHOLDS: PromotionThresholds = {
  // Classes between stripes at each belt level
  stripeThresholds: {
    white: 25,   // ~2 months at 3x/week
    blue: 40,    // ~3 months at 3x/week
    purple: 50,  // ~4 months at 3x/week
    brown: 60,   // ~5 months at 3x/week
    black: 100,  // Black belt degrees are traditionally time-based (years)
  },
  // Classes to be eligible for next belt (at 4 stripes)
  // Based roughly on IBJJF minimum time requirements
  beltThresholds: {
    white: 200,  // ~1.5 years at 3x/week
    blue: 300,   // ~2 years at 3x/week (IBJJF minimum)
    purple: 225, // ~1.5 years at 3x/week (IBJJF minimum)
    brown: 150,  // ~1 year at 3x/week (IBJJF minimum)
  },
};
