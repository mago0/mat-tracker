import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, createTestStudent } from "@/test/db";
import { students, attendance, promotions, notes, BELTS, CLASS_TYPES, NOTE_CATEGORIES } from "./schema";

describe("Database Schema", () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  describe("students table", () => {
    it("should insert a new student", () => {
      const student = createTestStudent(db);

      const [result] = db.select().from(students).where(eq(students.id, student.id)).all();

      expect(result).toBeDefined();
      expect(result.firstName).toBe("Test");
      expect(result.lastName).toBe("Student");
      expect(result.currentBelt).toBe("white");
      expect(result.currentStripes).toBe(0);
      expect(result.isActive).toBe(true);
    });

    it("should update student belt and stripes", () => {
      const student = createTestStudent(db);

      db.update(students)
        .set({ currentBelt: "blue", currentStripes: 2 })
        .where(eq(students.id, student.id))
        .run();

      const [result] = db.select().from(students).where(eq(students.id, student.id)).all();

      expect(result.currentBelt).toBe("blue");
      expect(result.currentStripes).toBe(2);
    });

    it("should soft delete (archive) a student", () => {
      const student = createTestStudent(db);

      db.update(students)
        .set({ isActive: false })
        .where(eq(students.id, student.id))
        .run();

      const [result] = db.select().from(students).where(eq(students.id, student.id)).all();

      expect(result.isActive).toBe(false);
    });

    it("should query only active students", () => {
      createTestStudent(db, { firstName: "Active", isActive: true });
      createTestStudent(db, { firstName: "Archived", isActive: false });

      const activeStudents = db.select().from(students).where(eq(students.isActive, true)).all();

      expect(activeStudents).toHaveLength(1);
      expect(activeStudents[0].firstName).toBe("Active");
    });
  });

  describe("attendance table", () => {
    it("should record attendance for a student", () => {
      const student = createTestStudent(db);
      const today = new Date().toISOString().split("T")[0];

      db.insert(attendance).values({
        id: crypto.randomUUID(),
        studentId: student.id,
        date: today,
        classType: "gi",
        createdAt: new Date().toISOString(),
      }).run();

      const records = db.select().from(attendance).where(eq(attendance.studentId, student.id)).all();

      expect(records).toHaveLength(1);
      expect(records[0].date).toBe(today);
      expect(records[0].classType).toBe("gi");
    });

    it("should support all class types", () => {
      const student = createTestStudent(db);

      for (const classType of CLASS_TYPES) {
        db.insert(attendance).values({
          id: crypto.randomUUID(),
          studentId: student.id,
          date: "2024-01-01",
          classType,
          createdAt: new Date().toISOString(),
        }).run();
      }

      const records = db.select().from(attendance).where(eq(attendance.studentId, student.id)).all();

      expect(records).toHaveLength(CLASS_TYPES.length);
    });
  });

  describe("promotions table", () => {
    it("should record a stripe promotion", () => {
      const student = createTestStudent(db);

      db.insert(promotions).values({
        id: crypto.randomUUID(),
        studentId: student.id,
        fromBelt: "white",
        fromStripes: 0,
        toBelt: "white",
        toStripes: 1,
        promotedAt: "2024-06-01",
        notes: "First stripe!",
      }).run();

      const [promo] = db.select().from(promotions).where(eq(promotions.studentId, student.id)).all();

      expect(promo.fromBelt).toBe("white");
      expect(promo.toBelt).toBe("white");
      expect(promo.fromStripes).toBe(0);
      expect(promo.toStripes).toBe(1);
      expect(promo.notes).toBe("First stripe!");
    });

    it("should record a belt promotion", () => {
      const student = createTestStudent(db, { currentBelt: "white", currentStripes: 4 });

      db.insert(promotions).values({
        id: crypto.randomUUID(),
        studentId: student.id,
        fromBelt: "white",
        fromStripes: 4,
        toBelt: "blue",
        toStripes: 0,
        promotedAt: "2024-12-01",
        notes: null,
      }).run();

      const [promo] = db.select().from(promotions).where(eq(promotions.studentId, student.id)).all();

      expect(promo.fromBelt).toBe("white");
      expect(promo.toBelt).toBe("blue");
    });
  });

  describe("notes table", () => {
    it("should add a note for a student", () => {
      const student = createTestStudent(db);

      db.insert(notes).values({
        id: crypto.randomUUID(),
        studentId: student.id,
        category: "technique",
        content: "Working on guard passing",
        createdAt: new Date().toISOString(),
      }).run();

      const [note] = db.select().from(notes).where(eq(notes.studentId, student.id)).all();

      expect(note.category).toBe("technique");
      expect(note.content).toBe("Working on guard passing");
    });

    it("should support all note categories", () => {
      const student = createTestStudent(db);

      for (const category of NOTE_CATEGORIES) {
        db.insert(notes).values({
          id: crypto.randomUUID(),
          studentId: student.id,
          category,
          content: `Note for ${category}`,
          createdAt: new Date().toISOString(),
        }).run();
      }

      const studentNotes = db.select().from(notes).where(eq(notes.studentId, student.id)).all();

      expect(studentNotes).toHaveLength(NOTE_CATEGORIES.length);
    });
  });

  describe("constants", () => {
    it("should have correct belt order", () => {
      expect(BELTS).toEqual(["white", "blue", "purple", "brown", "black"]);
    });

    it("should have all class types", () => {
      expect(CLASS_TYPES).toContain("gi");
      expect(CLASS_TYPES).toContain("nogi");
      expect(CLASS_TYPES).toContain("open_mat");
    });

    it("should have all note categories", () => {
      expect(NOTE_CATEGORIES).toContain("general");
      expect(NOTE_CATEGORIES).toContain("technique");
      expect(NOTE_CATEGORIES).toContain("injury");
      expect(NOTE_CATEGORIES).toContain("goals");
    });
  });
});
