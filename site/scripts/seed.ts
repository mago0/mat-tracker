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

// Realistic BJJ student names
const firstNames = [
  "Marcus",
  "Jake",
  "Tyler",
  "Brandon",
  "Derek",
  "Ryan",
  "Kevin",
  "Chris",
  "Mike",
  "Josh",
  "Amanda",
  "Sarah",
  "Jessica",
  "Emily",
  "Rachel",
  "Nicole",
  "Melissa",
  "Ashley",
  "Carlos",
  "Diego",
  "Andre",
  "Dmitri",
];

const lastNames = [
  "Johnson",
  "Williams",
  "Martinez",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Wilson",
  "Anderson",
  "Taylor",
  "Thomas",
  "Moore",
  "Jackson",
  "White",
  "Harris",
  "Clark",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "King",
  "Wright",
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

// Generate student profiles
function generateStudents(): StudentProfile[] {
  const today = new Date();
  const usedNames = new Set<string>();

  const students: StudentProfile[] = [];

  // Distribution: 4 consistent, 6 regular, 4 sporadic, 2 inactive, 2 very-inactive, 5 archived
  const patterns: AttendancePattern[] = [
    "consistent",
    "consistent",
    "consistent",
    "consistent",
    "regular",
    "regular",
    "regular",
    "regular",
    "regular",
    "regular",
    "sporadic",
    "sporadic",
    "sporadic",
    "sporadic",
    "inactive",
    "inactive",
    "very-inactive",
    "very-inactive",
    "archived",
    "archived",
    "archived",
    "archived",
    "archived",
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
    // Distribution for ~23 students: 9 white, 6 blue, 4 purple, 2 brown, 2 black
    let belt: schema.Belt;
    let stripes: number;
    let minDaysAgo: number;
    let maxDaysAgo: number;

    if (i < 2) {
      // Black belts (2) - 10-15 years training
      belt = "black";
      stripes = Math.floor(Math.random() * 3); // 0-2 stripes for black
      minDaysAgo = 3650; // 10 years
      maxDaysAgo = 5475; // 15 years
    } else if (i < 4) {
      // Brown belts (2) - 6-9 years training
      belt = "brown";
      stripes = Math.floor(Math.random() * 5);
      minDaysAgo = 2190; // 6 years
      maxDaysAgo = 3285; // 9 years
    } else if (i < 8) {
      // Purple belts (4) - 4-6 years training
      belt = "purple";
      stripes = Math.floor(Math.random() * 5);
      minDaysAgo = 1460; // 4 years
      maxDaysAgo = 2190; // 6 years
    } else if (i < 14) {
      // Blue belts (6) - 1.5-4 years training
      belt = "blue";
      stripes = Math.floor(Math.random() * 5);
      minDaysAgo = 548; // 1.5 years
      maxDaysAgo = 1460; // 4 years
    } else {
      // White belts (9) - 2 months to 1.5 years training
      belt = "white";
      stripes = Math.floor(Math.random() * 5);
      minDaysAgo = 60; // 2 months
      maxDaysAgo = 548; // 1.5 years
    }

    // Generate start date based on belt-appropriate range
    const daysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo)) + minDaysAgo;
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
    const totalDaysTraining = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate belt progression
    const currentBeltIndex = beltOrder.indexOf(profile.belt);

    // Generate belt promotions from white to current belt
    // Distribute belt promotions evenly across training time
    if (currentBeltIndex > 0) {
      // Time per belt (leaving ~20% of time at current belt for stripe work)
      const timeForBeltPromotions = totalDaysTraining * 0.8;
      const daysPerBelt = timeForBeltPromotions / currentBeltIndex;

      for (let i = 0; i < currentBeltIndex; i++) {
        const fromBelt = beltOrder[i];
        const toBelt = beltOrder[i + 1];
        // Add some variance (±20%)
        const variance = 0.8 + Math.random() * 0.4;
        const daysFromStart = Math.floor(daysPerBelt * (i + 1) * variance);
        const promoDate = new Date(startDate);
        promoDate.setDate(promoDate.getDate() + daysFromStart);

        // Don't create promotions in the future
        if (promoDate < today) {
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
      const daysAtCurrentBelt = Math.floor((today.getTime() - beltStartDate.getTime()) / (1000 * 60 * 60 * 24));

      // Distribute stripe promotions across time at current belt
      // Leave some time since last stripe for "progress tracking"
      const timeForStripes = daysAtCurrentBelt * 0.85;
      const daysPerStripe = timeForStripes / profile.stripes;

      for (let stripe = 1; stripe <= profile.stripes; stripe++) {
        const variance = 0.8 + Math.random() * 0.4;
        const daysFromBeltStart = Math.floor(daysPerStripe * stripe * variance);
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
