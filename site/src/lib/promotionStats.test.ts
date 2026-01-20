import { describe, it, expect } from "vitest";
import {
  calculatePromotionStatus,
  getNextBelt,
} from "./promotionStats";
import { DEFAULT_PROMOTION_THRESHOLDS } from "./db/schema";

describe("promotionStats", () => {
  describe("calculatePromotionStatus", () => {
    const thresholds = DEFAULT_PROMOTION_THRESHOLDS;

    describe("stripe promotions", () => {
      it("should return stripeDue=false when below threshold", () => {
        const status = calculatePromotionStatus(
          { currentBelt: "white", currentStripes: 0 },
          10, // classes
          30, // days
          "2024-01-01",
          thresholds
        );

        expect(status.stripeDue).toBe(false);
        expect(status.beltEligible).toBe(false);
        expect(status.isStripePromotion).toBe(true);
        expect(status.nextThreshold).toBe(25); // white belt stripe threshold
        expect(status.progress).toBe(40); // 10/25 = 40%
      });

      it("should return stripeDue=true when at or above threshold", () => {
        const status = calculatePromotionStatus(
          { currentBelt: "white", currentStripes: 0 },
          25, // exactly at threshold
          60,
          "2024-01-01",
          thresholds
        );

        expect(status.stripeDue).toBe(true);
        expect(status.beltEligible).toBe(false);
        expect(status.progress).toBe(100);
      });

      it("should return stripeDue=true when above threshold", () => {
        const status = calculatePromotionStatus(
          { currentBelt: "blue", currentStripes: 2 },
          50, // above 40 threshold for blue
          90,
          "2024-01-01",
          thresholds
        );

        expect(status.stripeDue).toBe(true);
        expect(status.progress).toBe(100); // capped at 100
        expect(status.nextThreshold).toBe(40); // blue belt stripe threshold
      });

      it("should use belt-specific thresholds", () => {
        // Purple belt has threshold of 50
        const status = calculatePromotionStatus(
          { currentBelt: "purple", currentStripes: 1 },
          48,
          100,
          "2024-01-01",
          thresholds
        );

        expect(status.stripeDue).toBe(false);
        expect(status.nextThreshold).toBe(50);
        expect(status.progress).toBe(96); // 48/50 = 96%
      });
    });

    describe("belt promotions", () => {
      it("should return beltEligible=false when at 4 stripes but below belt threshold", () => {
        const status = calculatePromotionStatus(
          { currentBelt: "white", currentStripes: 4 },
          100, // below 200 threshold
          200,
          "2024-01-01",
          thresholds
        );

        expect(status.stripeDue).toBe(false);
        expect(status.beltEligible).toBe(false);
        expect(status.isStripePromotion).toBe(false);
        expect(status.nextThreshold).toBe(200); // white belt promotion threshold
        expect(status.progress).toBe(50);
      });

      it("should return beltEligible=true when at 4 stripes and above belt threshold", () => {
        const status = calculatePromotionStatus(
          { currentBelt: "white", currentStripes: 4 },
          220, // above 200 threshold
          365,
          "2024-01-01",
          thresholds
        );

        expect(status.stripeDue).toBe(false);
        expect(status.beltEligible).toBe(true);
        expect(status.progress).toBe(100);
      });

      it("should use belt-specific thresholds for belt promotions", () => {
        // Brown belt promotion requires 150 classes
        const status = calculatePromotionStatus(
          { currentBelt: "brown", currentStripes: 4 },
          120,
          500,
          "2024-01-01",
          thresholds
        );

        expect(status.beltEligible).toBe(false);
        expect(status.nextThreshold).toBe(150);
        expect(status.progress).toBe(80);
      });
    });

    describe("black belt special cases", () => {
      it("should handle black belt stripes normally", () => {
        const status = calculatePromotionStatus(
          { currentBelt: "black", currentStripes: 1 },
          80,
          365,
          "2024-01-01",
          thresholds
        );

        expect(status.isStripePromotion).toBe(true);
        expect(status.nextThreshold).toBe(100); // black belt stripe threshold
        expect(status.stripeDue).toBe(false);
      });

      it("should never be eligible for next belt at 4 stripes (no belt after black)", () => {
        const status = calculatePromotionStatus(
          { currentBelt: "black", currentStripes: 4 },
          1000, // lots of classes
          3650, // 10 years
          "2024-01-01",
          thresholds
        );

        expect(status.beltEligible).toBe(false);
        expect(status.nextThreshold).toBe(Infinity);
        expect(status.progress).toBe(100); // shows as complete since no next belt
      });
    });

    describe("days since promotion", () => {
      it("should correctly pass through days since promotion", () => {
        const status = calculatePromotionStatus(
          { currentBelt: "blue", currentStripes: 2 },
          15,
          120,
          "2024-09-01",
          thresholds
        );

        expect(status.daysSincePromotion).toBe(120);
        expect(status.lastPromotionDate).toBe("2024-09-01");
      });
    });
  });

  describe("getNextBelt", () => {
    it("should return next belt in sequence", () => {
      expect(getNextBelt("white")).toBe("blue");
      expect(getNextBelt("blue")).toBe("purple");
      expect(getNextBelt("purple")).toBe("brown");
      expect(getNextBelt("brown")).toBe("black");
    });

    it("should return null for black belt", () => {
      expect(getNextBelt("black")).toBe(null);
    });
  });
});
