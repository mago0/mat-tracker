/**
 * Seed script for mat-tracker
 *
 * Generates ~20 realistic BJJ students with:
 * - Full contact information
 * - Attendance on Mon/Thu/Sat with varied patterns
 * - Mix of belt levels based on start date
 * - A few inactive students (30+ days without attendance)
 *
 * Run with: npx tsx scripts/seed.ts
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/lib/db/schema";

const dbPath = process.env.DATABASE_PATH || "./data/mat-tracker.db";
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
const db = drizzle(sqlite, { schema });

// Helper to generate UUID
function uuid(): string {
  return crypto.randomUUID();
}

// Helper to format date as ISO string (YYYY-MM-DD)
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Helper to get a random item from array
function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to check if date is Mon (1), Wed (3), Sat (6), or Sun (0)
function isClassDay(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 1 || day === 3 || day === 6;
}

// Realistic BJJ student names - expanded for 50+ students
const firstNames = [
  "Marcus", "Jake", "Tyler", "Brandon", "Derek", "Ryan", "Kevin", "Chris",
  "Mike", "Josh", "Amanda", "Sarah", "Jessica", "Emily", "Rachel", "Nicole",
  "Melissa", "Ashley", "Carlos", "Diego", "Andre", "Dmitri", "Alex", "Jordan",
  "Taylor", "Morgan", "Casey", "Sam", "Pat", "Jamie", "Drew", "Corey",
  "Shane", "Travis", "Blake", "Hunter", "Logan", "Ethan", "Mason", "Liam",
  "Noah", "Olivia", "Emma", "Ava", "Sophia", "Isabella", "Mia", "Charlotte",
];

const lastNames = [
  "Johnson", "Williams", "Martinez", "Garcia", "Miller", "Davis", "Rodriguez",
  "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "White",
  "Harris", "Clark", "Lewis", "Robinson", "Walker", "Young", "King", "Wright",
  "Scott", "Green", "Baker", "Adams", "Nelson", "Hill", "Ramirez", "Campbell",
  "Mitchell", "Roberts", "Carter", "Phillips", "Evans", "Turner", "Torres",
  "Parker", "Collins", "Edwards", "Stewart", "Sanchez", "Morris", "Rogers",
];

// Student profiles with attendance patterns
type AttendancePattern = "consistent" | "regular" | "sporadic" | "inactive" | "very-inactive" | "archived";

interface StudentProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  emergencyPhone: string;
  startDate: Date;
  belt: schema.Belt;
  stripes: number;
  pattern: AttendancePattern;
  isActive: boolean;
  archivedDaysAgo?: number; // When they stopped attending (for archived students)
}

// Realistic minimum months at belt per stripe (based on typical BJJ progression)
// These represent minimum time to earn each stripe
const MONTHS_PER_STRIPE: Record<schema.Belt, number> = {
  white: 2.5,   // ~2-3 months per stripe
  blue: 5,     // ~4-6 months per stripe (IBJJF requires 2 years minimum at blue)
  purple: 4,   // ~3-5 months per stripe (IBJJF requires 1.5 years minimum at purple)
  brown: 3.5,  // ~3-4 months per stripe (IBJJF requires 1 year minimum at brown)
  black: 36,   // Degrees for black belt take years
};

// Minimum months at previous belt before promotion (IBJJF minimums as guide)
const MIN_MONTHS_FOR_BELT: Record<schema.Belt, number> = {
  white: 0,    // Starting belt
  blue: 12,    // ~1 year to blue (though varies widely)
  purple: 24,  // IBJJF: 2 years at blue minimum
  brown: 18,   // IBJJF: 1.5 years at purple minimum
  black: 12,   // IBJJF: 1 year at brown minimum
};

// Calculate minimum training days needed for a belt/stripe combination
function calculateMinimumTrainingDays(belt: schema.Belt, stripes: number): number {
  const beltOrder: schema.Belt[] = ["white", "blue", "purple", "brown", "black"];
  const currentBeltIndex = beltOrder.indexOf(belt);

  // Sum up time needed for all belt promotions
  let totalMonths = 0;
  for (let i = 0; i < currentBeltIndex; i++) {
    const nextBelt = beltOrder[i + 1];
    totalMonths += MIN_MONTHS_FOR_BELT[nextBelt];
  }

  // Add time at current belt based on stripes
  totalMonths += stripes * MONTHS_PER_STRIPE[belt];

  // Add some buffer time (10-30%)
  const buffer = 1.1 + Math.random() * 0.2;

  return Math.floor(totalMonths * 30 * buffer); // Convert to days
}

// Generate student profiles
function generateStudents(): StudentProfile[] {
  const today = new Date();
  const usedNames = new Set<string>();

  const students: StudentProfile[] = [];

  // Distribution for 50 students:
  // 8 consistent, 14 regular, 10 sporadic, 6 inactive, 4 very-inactive, 8 archived
  const patterns: AttendancePattern[] = [
    // Consistent (8)
    "consistent", "consistent", "consistent", "consistent",
    "consistent", "consistent", "consistent", "consistent",
    // Regular (14)
    "regular", "regular", "regular", "regular", "regular", "regular", "regular",
    "regular", "regular", "regular", "regular", "regular", "regular", "regular",
    // Sporadic (10)
    "sporadic", "sporadic", "sporadic", "sporadic", "sporadic",
    "sporadic", "sporadic", "sporadic", "sporadic", "sporadic",
    // Inactive (6)
    "inactive", "inactive", "inactive", "inactive", "inactive", "inactive",
    // Very-inactive (4)
    "very-inactive", "very-inactive", "very-inactive", "very-inactive",
    // Archived (8)
    "archived", "archived", "archived", "archived",
    "archived", "archived", "archived", "archived",
  ];

  for (let i = 0; i < patterns.length; i++) {
    // Get unique name
    let firstName: string, lastName: string, fullName: string;
    do {
      firstName = randomFrom(firstNames);
      lastName = randomFrom(lastNames);
      fullName = `${firstName} ${lastName}`;
    } while (usedNames.has(fullName));
    usedNames.add(fullName);

    // Assign belt based on index to ensure proper distribution
    // Distribution for 50 students: 20 white, 14 blue, 8 purple, 5 brown, 3 black
    let belt: schema.Belt;
    let stripes: number;

    if (i < 3) {
      // Black belts (3)
      belt = "black";
      stripes = Math.floor(Math.random() * 3); // 0-2 degrees for black
    } else if (i < 8) {
      // Brown belts (5)
      belt = "brown";
      stripes = Math.floor(Math.random() * 5);
    } else if (i < 16) {
      // Purple belts (8)
      belt = "purple";
      stripes = Math.floor(Math.random() * 5);
    } else if (i < 30) {
      // Blue belts (14)
      belt = "blue";
      stripes = Math.floor(Math.random() * 5);
    } else {
      // White belts (20)
      belt = "white";
      stripes = Math.floor(Math.random() * 5);
    }

    // Calculate minimum days needed based on belt and stripes
    const minDaysNeeded = calculateMinimumTrainingDays(belt, stripes);

    // Add variance: minimum needed + 0-50% extra time
    const extraTimeFactor = 1 + Math.random() * 0.5;
    const daysAgo = Math.floor(minDaysNeeded * extraTimeFactor);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysAgo);

    const areaCode = randomFrom(["304", "681", "540", "276"]);
    const phone = `${areaCode}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
    const emergencyPhone = `${areaCode}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;

    // Archived students stopped attending 90-365 days ago
    const isArchived = patterns[i] === "archived";
    const archivedDaysAgo = isArchived
      ? 90 + Math.floor(Math.random() * 275) // 90-365 days ago
      : undefined;

    students.push({
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone,
      emergencyContact: `${randomFrom(["Mom", "Dad", "Spouse", "Partner", "Brother", "Sister"])} - ${randomFrom(firstNames)}`,
      emergencyPhone,
      startDate,
      belt,
      stripes,
      pattern: patterns[i],
      isActive: !isArchived,
      archivedDaysAgo,
    });
  }

  return students;
}

// Generate attendance records for a student based on their pattern
function generateAttendance(
  studentId: string,
  startDate: Date,
  pattern: AttendancePattern,
  archivedDaysAgo?: number
): schema.NewAttendance[] {
  const today = new Date();
  const attendance: schema.NewAttendance[] = [];

  // Determine the last attendance date based on pattern
  let lastAttendanceDate = new Date(today);
  if (pattern === "inactive") {
    // 35-50 days ago
    lastAttendanceDate.setDate(lastAttendanceDate.getDate() - (35 + Math.floor(Math.random() * 15)));
  } else if (pattern === "very-inactive") {
    // 60-90 days ago
    lastAttendanceDate.setDate(lastAttendanceDate.getDate() - (60 + Math.floor(Math.random() * 30)));
  } else if (pattern === "archived" && archivedDaysAgo) {
    // Archived students - last attendance was archivedDaysAgo
    lastAttendanceDate.setDate(lastAttendanceDate.getDate() - archivedDaysAgo);
  }

  // Attendance probability based on pattern
  let attendanceProbability: number;
  switch (pattern) {
    case "consistent":
      attendanceProbability = 0.85; // Rarely misses
      break;
    case "regular":
      attendanceProbability = 0.6; // Attends most classes
      break;
    case "sporadic":
      attendanceProbability = 0.35; // Misses more than attends
      break;
    case "inactive":
    case "very-inactive":
      attendanceProbability = 0.5; // Was regular before going inactive
      break;
    case "archived":
      attendanceProbability = 0.55; // Was fairly regular before dropping off
      break;
    default:
      attendanceProbability = 0.5;
  }

  // Iterate through each day from start date to last attendance date
  const current = new Date(startDate);
  while (current <= lastAttendanceDate) {
    if (isClassDay(current)) {
      const day = current.getDay();

      // Sunday has lower attendance (typically 5-10 people out of ~20)
      const dayProbability = day === 0
        ? attendanceProbability * 0.4  // ~40% of normal attendance on Sundays
        : attendanceProbability;

      if (Math.random() < dayProbability) {
        // Determine class type based on day
        let classType: schema.ClassType;
        if (day === 0) {
          // Sunday - nogi
          classType = "nogi";
        } else if (day === 1) {
          // Monday - nogi
          classType = "nogi";
        } else if (day === 3) {
          // Wednesday - gi
          classType = "gi";
        } else {
          // Saturday - open mat
          classType = "open_mat";
        }

        attendance.push({
          id: uuid(),
          studentId,
          date: formatDate(current),
          classType,
          createdAt: new Date(current).toISOString(),
        });
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return attendance;
}

async function seed() {
  console.log("🥋 Seeding mat-tracker database...\n");

  // Clear existing data
  console.log("Clearing existing data...");
  db.delete(schema.attendance).run();
  db.delete(schema.promotions).run();
  db.delete(schema.notes).run();
  db.delete(schema.students).run();
  db.delete(schema.settings).run();

  // Generate and insert students
  const studentProfiles = generateStudents();
  console.log(`\nCreating ${studentProfiles.length} students...`);

  const studentRecords: { id: string; profile: StudentProfile }[] = [];

  for (const profile of studentProfiles) {
    const id = uuid();
    const now = new Date().toISOString();

    db.insert(schema.students)
      .values({
        id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        emergencyContact: profile.emergencyContact,
        emergencyPhone: profile.emergencyPhone,
        startDate: formatDate(profile.startDate),
        currentBelt: profile.belt,
        currentStripes: profile.stripes,
        isActive: profile.isActive,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    studentRecords.push({ id, profile });

    const patternLabel =
      profile.pattern === "archived"
        ? "(archived)"
        : profile.pattern === "very-inactive"
          ? "(inactive 60+ days)"
          : profile.pattern === "inactive"
            ? "(inactive 35+ days)"
            : "";

    console.log(
      `  ✓ ${profile.firstName} ${profile.lastName} - ${profile.belt} belt, ${profile.stripes} stripes ${patternLabel}`
    );
  }

  // Generate and insert attendance
  console.log("\nGenerating attendance records...");
  let totalAttendance = 0;

  for (const { id, profile } of studentRecords) {
    const attendanceRecords = generateAttendance(
      id,
      profile.startDate,
      profile.pattern,
      profile.archivedDaysAgo
    );
    totalAttendance += attendanceRecords.length;

    for (const record of attendanceRecords) {
      db.insert(schema.attendance).values(record).run();
    }
  }

  console.log(`  ✓ Created ${totalAttendance} attendance records`);

  // Generate realistic promotion history for all students
  console.log("\nGenerating promotion records...");
  let totalPromotions = 0;

  const beltOrder: schema.Belt[] = ["white", "blue", "purple", "brown", "black"];

  for (const { id, profile } of studentRecords) {
    const promotions: Array<{
      fromBelt: schema.Belt;
      fromStripes: number;
      toBelt: schema.Belt;
      toStripes: number;
      date: Date;
    }> = [];

    const startDate = new Date(profile.startDate);
    const today = new Date();

    // Calculate belt progression using realistic time requirements
    const currentBeltIndex = beltOrder.indexOf(profile.belt);

    // Work backwards: calculate when current belt was earned based on stripes
    // This ensures time at current belt is realistic
    // For 0 stripes, they've still been at this belt for at least a few months
    const minMonthsAtBelt = profile.stripes === 0 ? (2 + Math.random() * 4) : 0; // 2-6 months minimum
    const daysAtCurrentBelt = (profile.stripes * MONTHS_PER_STRIPE[profile.belt] + minMonthsAtBelt) * 30 * (1.1 + Math.random() * 0.3);
    const currentBeltPromotionDate = new Date(today);
    currentBeltPromotionDate.setDate(currentBeltPromotionDate.getDate() - Math.floor(daysAtCurrentBelt));

    // Generate belt promotions from white to current belt
    if (currentBeltIndex > 0) {
      // Calculate time available for all belt promotions
      const timeBeforeCurrentBelt = Math.floor((currentBeltPromotionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Distribute previous belt promotions based on minimum requirements
      let cumulativeDays = 0;
      const totalMinMonths = beltOrder.slice(1, currentBeltIndex + 1).reduce((sum, belt) => sum + MIN_MONTHS_FOR_BELT[belt], 0);
      const scaleFactor = timeBeforeCurrentBelt / (totalMinMonths * 30);

      for (let i = 0; i < currentBeltIndex; i++) {
        const fromBelt = beltOrder[i];
        const toBelt = beltOrder[i + 1];
        const isLastBeltPromo = (i === currentBeltIndex - 1);

        // Use minimum time scaled to available time, with some variance
        const monthsAtBelt = MIN_MONTHS_FOR_BELT[toBelt] * scaleFactor * (0.9 + Math.random() * 0.2);
        cumulativeDays += Math.floor(monthsAtBelt * 30);

        // For the last belt promotion (to current belt), use currentBeltPromotionDate
        // to ensure it's always recorded
        let promoDate: Date;
        if (isLastBeltPromo) {
          promoDate = new Date(currentBeltPromotionDate);
        } else {
          promoDate = new Date(startDate);
          promoDate.setDate(promoDate.getDate() + cumulativeDays);
        }

        // Don't create promotions in the future
        if (promoDate <= today) {
          promotions.push({
            fromBelt,
            fromStripes: 4, // Typically promoted at 4 stripes
            toBelt,
            toStripes: 0,
            date: promoDate,
          });
        }
      }
    }

    // Generate stripe promotions at current belt (if they have stripes)
    if (profile.stripes > 0) {
      // Find when they got their current belt
      const lastBeltPromo = promotions.filter(p => p.toBelt === profile.belt).pop();
      const beltStartDate = lastBeltPromo ? lastBeltPromo.date : startDate;

      // Distribute stripes based on realistic MONTHS_PER_STRIPE values
      const monthsPerStripeForBelt = MONTHS_PER_STRIPE[profile.belt];

      for (let stripe = 1; stripe <= profile.stripes; stripe++) {
        // Each stripe takes monthsPerStripeForBelt with some variance
        const variance = 0.85 + Math.random() * 0.3;
        const daysFromBeltStart = Math.floor(stripe * monthsPerStripeForBelt * 30 * variance);
        const promoDate = new Date(beltStartDate);
        promoDate.setDate(promoDate.getDate() + daysFromBeltStart);

        // Don't create promotions in the future
        if (promoDate < today) {
          promotions.push({
            fromBelt: profile.belt,
            fromStripes: stripe - 1,
            toBelt: profile.belt,
            toStripes: stripe,
            date: promoDate,
          });
        }
      }
    }

    // Sort by date and insert
    promotions.sort((a, b) => a.date.getTime() - b.date.getTime());

    for (const promo of promotions) {
      const isBeltPromo = promo.fromBelt !== promo.toBelt;
      const notes = isBeltPromo
        ? `Promoted to ${promo.toBelt} belt`
        : `Earned stripe ${promo.toStripes}`;

      db.insert(schema.promotions)
        .values({
          id: uuid(),
          studentId: id,
          fromBelt: promo.fromBelt,
          fromStripes: promo.fromStripes,
          toBelt: promo.toBelt,
          toStripes: promo.toStripes,
          promotedAt: formatDate(promo.date),
          notes,
        })
        .run();

      totalPromotions++;
    }
  }

  console.log(`  ✓ Created ${totalPromotions} promotion records`);

  // Summary
  const activeCount = studentProfiles.filter((s) => s.isActive).length;
  const archivedCount = studentProfiles.filter((s) => !s.isActive).length;
  const inactiveCount = studentProfiles.filter(
    (s) => s.pattern === "inactive" || s.pattern === "very-inactive"
  ).length;

  // Belt distribution
  const beltCounts = {
    white: studentProfiles.filter((s) => s.belt === "white").length,
    blue: studentProfiles.filter((s) => s.belt === "blue").length,
    purple: studentProfiles.filter((s) => s.belt === "purple").length,
    brown: studentProfiles.filter((s) => s.belt === "brown").length,
    black: studentProfiles.filter((s) => s.belt === "black").length,
  };

  console.log("\n📊 Summary:");
  console.log(`  Active students: ${activeCount}`);
  console.log(`  Archived students: ${archivedCount}`);
  console.log(`  Inactive students (30+ days): ${inactiveCount}`);
  console.log(`  Attendance records: ${totalAttendance}`);
  console.log("\n🥋 Belt Distribution:");
  console.log(`  White:  ${beltCounts.white}`);
  console.log(`  Blue:   ${beltCounts.blue}`);
  console.log(`  Purple: ${beltCounts.purple}`);
  console.log(`  Brown:  ${beltCounts.brown}`);
  console.log(`  Black:  ${beltCounts.black}`);

  console.log("\n✅ Seeding complete!");
}

seed().catch(console.error);
