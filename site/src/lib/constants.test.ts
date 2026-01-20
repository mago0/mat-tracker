import { describe, it, expect } from "vitest";
import { BELT_COLORS, BELT_LABELS, CLASS_TYPE_LABELS, NOTE_CATEGORY_LABELS } from "./constants";
import { BELTS, CLASS_TYPES, NOTE_CATEGORIES } from "./db/schema";

describe("Constants", () => {
  describe("BELT_COLORS", () => {
    it("should have colors for all belts", () => {
      for (const belt of BELTS) {
        expect(BELT_COLORS[belt]).toBeDefined();
        expect(BELT_COLORS[belt].bg).toBeDefined();
        expect(BELT_COLORS[belt].text).toBeDefined();
      }
    });

    it("should have appropriate background classes", () => {
      expect(BELT_COLORS.white.bg).toContain("bg-white");
      expect(BELT_COLORS.blue.bg).toContain("bg-blue");
      expect(BELT_COLORS.purple.bg).toContain("bg-purple");
      expect(BELT_COLORS.brown.bg).toContain("bg-amber");
      expect(BELT_COLORS.black.bg).toContain("bg-black");
    });
  });

  describe("BELT_LABELS", () => {
    it("should have labels for all belts", () => {
      for (const belt of BELTS) {
        expect(BELT_LABELS[belt]).toBeDefined();
        expect(typeof BELT_LABELS[belt]).toBe("string");
      }
    });

    it("should have human-readable labels", () => {
      expect(BELT_LABELS.white).toBe("White Belt");
      expect(BELT_LABELS.blue).toBe("Blue Belt");
      expect(BELT_LABELS.purple).toBe("Purple Belt");
      expect(BELT_LABELS.brown).toBe("Brown Belt");
      expect(BELT_LABELS.black).toBe("Black Belt");
    });
  });

  describe("CLASS_TYPE_LABELS", () => {
    it("should have labels for all class types", () => {
      for (const type of CLASS_TYPES) {
        expect(CLASS_TYPE_LABELS[type]).toBeDefined();
        expect(typeof CLASS_TYPE_LABELS[type]).toBe("string");
      }
    });

    it("should have human-readable labels", () => {
      expect(CLASS_TYPE_LABELS.gi).toBe("Gi");
      expect(CLASS_TYPE_LABELS.nogi).toBe("No-Gi");
      expect(CLASS_TYPE_LABELS.open_mat).toBe("Open Mat");
    });
  });

  describe("NOTE_CATEGORY_LABELS", () => {
    it("should have labels for all note categories", () => {
      for (const category of NOTE_CATEGORIES) {
        expect(NOTE_CATEGORY_LABELS[category]).toBeDefined();
        expect(typeof NOTE_CATEGORY_LABELS[category]).toBe("string");
      }
    });

    it("should have human-readable labels", () => {
      expect(NOTE_CATEGORY_LABELS.general).toBe("General");
      expect(NOTE_CATEGORY_LABELS.technique).toBe("Technique Focus");
      expect(NOTE_CATEGORY_LABELS.injury).toBe("Injury/Limitation");
      expect(NOTE_CATEGORY_LABELS.goals).toBe("Goals");
    });
  });
});
