import { describe, it, expect } from "vitest";
import {
  calculatePromotionStatus,
  getNextBelt,
  formatTimeAtBelt,
} from "./promotionStats";
import { getPromotionWarning } from "./promotionValidation";
import { DEFAULT_PROMOTION_THRESHOLDS } from "./db/schema";

describe("promotionStats", () => {
  describe("calculatePromotionStatus", () => {
    const thresholds = DEFAULT_PROMOTION_THRESHOLDS;

    describe("stripe promotions", () => {
      it("should return stripeDue=false when below threshold", () => {
        const status = calculatePromotionStatus(
          { currentBelt: "white", currentStripes: 0 },
          10, // classes
          30, // days since last promotion
          "2024-01-01", // last promotion date
          30, // days at belt
          "2024-01-01", // last belt promotion date
          thresholds
        );

        expect(status.stripeDue).toBe(false);
        expect(status.beltEligible).toBe(false);
        expect(status.isStripePromotion).toBe(true);
        expect(status.nextThreshold).toBe(40); // white belt stripe threshold
        expect(status.progress).toBe(25); // 10/40 = 25%
      });

      it("should return stripeDue=true when at or above threshold", () => {
        const status = calculatePromotionStatus(
          { currentBelt: "white", currentStripes: 0 },
          40, // exactly at threshold
          60,
          "2024-01-01",
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
          70, // above 60 threshold for blue
          90,
          "2024-01-01",
          365, // at blue belt for a year
          "2023-01-01",
          thresholds
        );

        expect(status.stripeDue).toBe(true);
        expect(status.progress).toBe(100); // capped at 100
        expect(status.nextThreshold).toBe(60); // blue belt stripe threshold
      });

      it("should use belt-specific thresholds", () => {
        // Purple belt has threshold of 50
        const status = calculatePromotionStatus(
          { currentBelt: "purple", currentStripes: 1 },
          48,
          100,
          "2024-01-01",
          730, // at purple belt for 2 years
          "2022-01-01",
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
          20, // below 40 threshold (classes after 4th stripe)
          200,
          "2024-01-01",
          365, // at white belt for a year
          "2023-01-01",
          thresholds
        );

        expect(status.stripeDue).toBe(false);
        expect(status.beltEligible).toBe(false);
        expect(status.isStripePromotion).toBe(false);
        expect(status.nextThreshold).toBe(40); // white belt promotion threshold
        expect(status.progress).toBe(50); // 20/40 = 50%
      });

      it("should return beltEligible=true when at 4 stripes and above belt threshold", () => {
        const status = calculatePromotionStatus(
          { currentBelt: "white", currentStripes: 4 },
          50, // above 40 threshold
          365,
          "2024-01-01",
          730, // at white belt for 2 years
          "2022-01-01",
          thresholds
        );

        expect(status.stripeDue).toBe(false);
        expect(status.beltEligible).toBe(true);
        expect(status.progress).toBe(100);
      });

      it("should use belt-specific thresholds for belt promotions", () => {
        // Brown belt promotion requires 30 classes after 4th stripe
        const status = calculatePromotionStatus(
          { currentBelt: "brown", currentStripes: 4 },
          24, // below 30 threshold
          500,
          "2024-01-01",
          1095, // at brown for 3 years
          "2021-01-01",
          thresholds
        );

        expect(status.beltEligible).toBe(false);
        expect(status.nextThreshold).toBe(30);
        expect(status.progress).toBe(80); // 24/30 = 80%
      });
    });

    describe("black belt special cases", () => {
      it("should handle black belt stripes normally", () => {
        const status = calculatePromotionStatus(
          { currentBelt: "black", currentStripes: 1 },
          80,
          365,
          "2024-01-01",
          1825, // at black for 5 years
          "2019-01-01",
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
          3650, // at black for 10 years
          "2014-01-01",
          thresholds
        );

        expect(status.beltEligible).toBe(false);
        expect(status.nextThreshold).toBe(Infinity);
        expect(status.progress).toBe(100); // shows as complete since no next belt
      });
    });

    describe("days since promotion and time at belt", () => {
      it("should correctly pass through days since promotion", () => {
        const status = calculatePromotionStatus(
          { currentBelt: "blue", currentStripes: 2 },
          15,
          120, // days since last stripe
          "2024-09-01",
          500, // days at blue belt
          "2023-06-01",
          thresholds
        );

        expect(status.daysSincePromotion).toBe(120);
        expect(status.lastPromotionDate).toBe("2024-09-01");
        expect(status.daysAtBelt).toBe(500);
        expect(status.lastBeltPromotionDate).toBe("2023-06-01");
      });
    });
  });

  describe("formatTimeAtBelt", () => {
    it("should format days correctly", () => {
      expect(formatTimeAtBelt(1)).toBe("1 day");
      expect(formatTimeAtBelt(15)).toBe("15 days");
      expect(formatTimeAtBelt(29)).toBe("29 days");
    });

    it("should format months correctly", () => {
      expect(formatTimeAtBelt(30)).toBe("1 month");
      expect(formatTimeAtBelt(60)).toBe("2 months");
      expect(formatTimeAtBelt(180)).toBe("6 months");
      expect(formatTimeAtBelt(330)).toBe("11 months");
    });

    it("should format years correctly", () => {
      expect(formatTimeAtBelt(365)).toBe("1y");
      expect(formatTimeAtBelt(730)).toBe("2y");
    });

    it("should format years and months correctly", () => {
      expect(formatTimeAtBelt(395)).toBe("1y 1mo");
      expect(formatTimeAtBelt(450)).toBe("1y 3mo");
      expect(formatTimeAtBelt(900)).toBe("2y 6mo");
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

  describe("getPromotionWarning", () => {
    describe("standard promotions (should return null)", () => {
      it("should allow no change", () => {
        expect(getPromotionWarning("white", 0, "white", 0)).toBe(null);
        expect(getPromotionWarning("blue", 2, "blue", 2)).toBe(null);
      });

      it("should allow standard stripe increment", () => {
        expect(getPromotionWarning("white", 0, "white", 1)).toBe(null);
        expect(getPromotionWarning("blue", 2, "blue", 3)).toBe(null);
        expect(getPromotionWarning("purple", 3, "purple", 4)).toBe(null);
      });

      it("should allow standard belt promotion (4 stripes to next belt 0 stripes)", () => {
        expect(getPromotionWarning("white", 4, "blue", 0)).toBe(null);
        expect(getPromotionWarning("blue", 4, "purple", 0)).toBe(null);
        expect(getPromotionWarning("brown", 4, "black", 0)).toBe(null);
      });
    });

    describe("non-standard promotions (should return warning)", () => {
      it("should warn when going backwards in belt", () => {
        const warning = getPromotionWarning("blue", 2, "white", 0);
        expect(warning).not.toBe(null);
        expect(warning).toContain("backwards");
      });

      it("should warn when skipping belts", () => {
        const warning = getPromotionWarning("white", 4, "purple", 0);
        expect(warning).not.toBe(null);
        expect(warning).toContain("skipping");
      });

      it("should warn when promoting to next belt without 4 stripes", () => {
        const warning = getPromotionWarning("white", 2, "blue", 0);
        expect(warning).not.toBe(null);
        expect(warning).toContain("without 4 stripes");
      });

      it("should warn when new belt starts with stripes > 0", () => {
        const warning = getPromotionWarning("white", 4, "blue", 2);
        expect(warning).not.toBe(null);
        expect(warning).toContain("instead of 0");
      });

      it("should warn when skipping stripes on same belt", () => {
        const warning = getPromotionWarning("blue", 1, "blue", 3);
        expect(warning).not.toBe(null);
        expect(warning).toContain("skipping");
      });

      it("should warn when reducing stripes on same belt", () => {
        const warning = getPromotionWarning("blue", 3, "blue", 1);
        expect(warning).not.toBe(null);
        expect(warning).toContain("reducing stripes");
      });

      it("should combine multiple warnings", () => {
        // Blue 2 stripes to Brown 3 stripes (skipping purple, without 4 stripes, starting with 3)
        const warning = getPromotionWarning("blue", 2, "brown", 3);
        expect(warning).not.toBe(null);
        expect(warning).toContain("skipping");
        expect(warning).toContain("without 4 stripes");
        expect(warning).toContain("instead of 0");
      });
    });
  });
});
