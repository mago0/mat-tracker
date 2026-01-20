import { db } from "./db";
import {
  settings,
  attendance,
  promotions,
  students,
  type Student,
  type Belt,
  type PromotionThresholds,
  DEFAULT_PROMOTION_THRESHOLDS,
  BELTS,
} from "./db/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { getLocalDateString } from "./dateUtils";

const SETTINGS_KEY = "promotionThresholds";

/**
 * Get promotion thresholds from the database, falling back to defaults
 */
export async function getPromotionThresholds(): Promise<PromotionThresholds> {
  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, SETTINGS_KEY));

  if (!setting) {
    return DEFAULT_PROMOTION_THRESHOLDS;
  }

  try {
    return JSON.parse(setting.value) as PromotionThresholds;
  } catch {
    return DEFAULT_PROMOTION_THRESHOLDS;
  }
}

/**
 * Save promotion thresholds to the database
 */
export async function savePromotionThresholds(
  thresholds: PromotionThresholds
): Promise<void> {
  const value = JSON.stringify(thresholds);

  // Upsert: try to update, insert if doesn't exist
  const [existing] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, SETTINGS_KEY));

  if (existing) {
    await db
      .update(settings)
      .set({ value })
      .where(eq(settings.key, SETTINGS_KEY));
  } else {
    await db.insert(settings).values({ key: SETTINGS_KEY, value });
  }
}

/**
 * Get the date to use as baseline for counting attendance.
 * Returns the most recent promotion date, or student's startDate if no promotions.
 */
export async function getLastPromotionDate(studentId: string): Promise<string> {
  const [lastPromo] = await db
    .select({ promotedAt: promotions.promotedAt })
    .from(promotions)
    .where(eq(promotions.studentId, studentId))
    .orderBy(desc(promotions.promotedAt))
    .limit(1);

  if (lastPromo) {
    return lastPromo.promotedAt;
  }

  // Fall back to start date
  const [student] = await db
    .select({ startDate: students.startDate })
    .from(students)
    .where(eq(students.id, studentId));

  return student?.startDate ?? getLocalDateString();
}

/**
 * Count attendance records since a given date
 */
export async function getAttendanceSinceDate(
  studentId: string,
  sinceDate: string
): Promise<number> {
  const records = await db
    .select({ date: attendance.date })
    .from(attendance)
    .where(
      and(eq(attendance.studentId, studentId), gte(attendance.date, sinceDate))
    );

  return records.length;
}

export interface PromotionStatus {
  classesSincePromotion: number;
  daysSincePromotion: number;
  lastPromotionDate: string;
  stripeDue: boolean;
  beltEligible: boolean;
  progress: number; // 0-100 percentage toward next threshold
  nextThreshold: number;
  isStripePromotion: boolean; // true if next promotion is a stripe, false if belt
}

/**
 * Calculate promotion status for a student
 */
export function calculatePromotionStatus(
  student: Pick<Student, "currentBelt" | "currentStripes">,
  classesSincePromotion: number,
  daysSincePromotion: number,
  lastPromotionDate: string,
  thresholds: PromotionThresholds
): PromotionStatus {
  const { currentBelt, currentStripes } = student;
  const isStripePromotion = currentStripes < 4;

  // Determine the threshold for next promotion
  let nextThreshold: number;
  if (isStripePromotion) {
    nextThreshold = thresholds.stripeThresholds[currentBelt];
  } else {
    // At 4 stripes, next promotion is to next belt
    // Black belts at 4 stripes have no automatic next threshold
    nextThreshold = thresholds.beltThresholds[currentBelt] ?? Infinity;
  }

  const progress =
    nextThreshold === Infinity
      ? 100
      : Math.min(100, Math.round((classesSincePromotion / nextThreshold) * 100));

  const stripeDue = isStripePromotion && classesSincePromotion >= nextThreshold;
  const beltEligible =
    !isStripePromotion &&
    currentBelt !== "black" &&
    classesSincePromotion >= nextThreshold;

  return {
    classesSincePromotion,
    daysSincePromotion,
    lastPromotionDate,
    stripeDue,
    beltEligible,
    progress,
    nextThreshold,
    isStripePromotion,
  };
}

/**
 * Get complete promotion status for a student (convenience function that fetches all data)
 */
export async function getStudentPromotionStatus(
  studentId: string,
  student: Pick<Student, "currentBelt" | "currentStripes">
): Promise<PromotionStatus> {
  const [thresholds, lastPromotionDate] = await Promise.all([
    getPromotionThresholds(),
    getLastPromotionDate(studentId),
  ]);

  const classesSincePromotion = await getAttendanceSinceDate(
    studentId,
    lastPromotionDate
  );

  const today = new Date();
  const promoDate = new Date(lastPromotionDate);
  const daysSincePromotion = Math.floor(
    (today.getTime() - promoDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return calculatePromotionStatus(
    student,
    classesSincePromotion,
    daysSincePromotion,
    lastPromotionDate,
    thresholds
  );
}

/**
 * Get promotion status for all active students (for the report page)
 */
export async function getAllStudentsPromotionStatus(): Promise<
  Array<{
    student: Student;
    status: PromotionStatus;
  }>
> {
  const thresholds = await getPromotionThresholds();

  const activeStudents = await db
    .select()
    .from(students)
    .where(eq(students.isActive, true));

  const results = await Promise.all(
    activeStudents.map(async (student) => {
      const lastPromotionDate = await getLastPromotionDate(student.id);
      const classesSincePromotion = await getAttendanceSinceDate(
        student.id,
        lastPromotionDate
      );

      const today = new Date();
      const promoDate = new Date(lastPromotionDate);
      const daysSincePromotion = Math.floor(
        (today.getTime() - promoDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const status = calculatePromotionStatus(
        student,
        classesSincePromotion,
        daysSincePromotion,
        lastPromotionDate,
        thresholds
      );

      return { student, status };
    })
  );

  return results;
}

/**
 * Get the next belt in sequence
 */
export function getNextBelt(currentBelt: Belt): Belt | null {
  const currentIndex = BELTS.indexOf(currentBelt);
  if (currentIndex === -1 || currentIndex === BELTS.length - 1) {
    return null;
  }
  return BELTS[currentIndex + 1];
}
