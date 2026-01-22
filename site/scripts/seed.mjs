/**
 * Production seed script for mat-tracker
 * Run with: node scripts/seed.mjs
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";

const dbPath = process.env.DATABASE_PATH || "./data/mat-tracker.db";
console.log(`Seeding database: ${dbPath}`);

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
const db = drizzle(sqlite);

// Helper to generate UUID
function uuid() {
  return crypto.randomUUID();
}

// Helper to format date as ISO string (YYYY-MM-DD)
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// Helper to get a random item from array
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper to check if date is Mon (1), Wed (3), Sat (6), or Sun (0)
function isClassDay(date) {
  const day = date.getDay();
  return day === 0 || day === 1 || day === 3 || day === 6;
}

// Realistic minimum months at belt per stripe (based on typical BJJ progression)
const MONTHS_PER_STRIPE = {
  white: 2.5,   // ~2-3 months per stripe
  blue: 5,     // ~4-6 months per stripe (IBJJF requires 2 years minimum at blue)
  purple: 4,   // ~3-5 months per stripe (IBJJF requires 1.5 years minimum at purple)
  brown: 3.5,  // ~3-4 months per stripe (IBJJF requires 1 year minimum at brown)
  black: 36,   // Degrees for black belt take years
};

// Minimum months at previous belt before promotion (IBJJF minimums as guide)
const MIN_MONTHS_FOR_BELT = {
  white: 0,    // Starting belt
  blue: 12,    // ~1 year to blue (though varies widely)
  purple: 24,  // IBJJF: 2 years at blue minimum
  brown: 18,   // IBJJF: 1.5 years at purple minimum
  black: 12,   // IBJJF: 1 year at brown minimum
};

// Calculate minimum training days needed for a belt/stripe combination
function calculateMinimumTrainingDays(belt, stripes) {
  const beltOrder = ["white", "blue", "purple", "brown", "black"];
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

// Realistic BJJ student names
const firstNames = [
  "Marcus", "Jake", "Tyler", "Brandon", "Derek", "Ryan", "Kevin", "Chris",
  "Mike", "Josh", "Amanda", "Sarah", "Jessica", "Emily", "Rachel", "Nicole",
  "Melissa", "Ashley", "Carlos", "Diego", "Andre", "Dmitri",
];

const lastNames = [
  "Johnson", "Williams", "Martinez", "Garcia", "Miller", "Davis", "Rodriguez",
  "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "White",
  "Harris", "Clark", "Lewis", "Robinson", "Walker", "Young", "King", "Wright",
];

// Generate student profiles
function generateStudents() {
  const today = new Date();
  const usedNames = new Set();
  const students = [];

  const patterns = [
    "consistent", "consistent", "consistent", "consistent",
    "regular", "regular", "regular", "regular", "regular", "regular",
    "sporadic", "sporadic", "sporadic", "sporadic",
    "inactive", "inactive",
    "very-inactive", "very-inactive",
    "archived", "archived", "archived", "archived", "archived",
  ];

  for (let i = 0; i < patterns.length; i++) {
    let firstName, lastName, fullName;
    do {
      firstName = randomFrom(firstNames);
      lastName = randomFrom(lastNames);
      fullName = `${firstName} ${lastName}`;
    } while (usedNames.has(fullName));
    usedNames.add(fullName);

    let belt, stripes;

    if (i < 2) {
      belt = "black";
      stripes = Math.floor(Math.random() * 3); // 0-2 degrees for black
    } else if (i < 4) {
      belt = "brown";
      stripes = Math.floor(Math.random() * 5);
    } else if (i < 8) {
      belt = "purple";
      stripes = Math.floor(Math.random() * 5);
    } else if (i < 14) {
      belt = "blue";
      stripes = Math.floor(Math.random() * 5);
    } else {
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

    const isArchived = patterns[i] === "archived";
    const archivedDaysAgo = isArchived ? 90 + Math.floor(Math.random() * 275) : undefined;

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

// Generate attendance records
function generateAttendance(studentId, startDate, pattern, archivedDaysAgo) {
  const today = new Date();
  const attendance = [];

  let lastAttendanceDate = new Date(today);
  if (pattern === "inactive") {
    lastAttendanceDate.setDate(lastAttendanceDate.getDate() - (35 + Math.floor(Math.random() * 15)));
  } else if (pattern === "very-inactive") {
    lastAttendanceDate.setDate(lastAttendanceDate.getDate() - (60 + Math.floor(Math.random() * 30)));
  } else if (pattern === "archived" && archivedDaysAgo) {
    lastAttendanceDate.setDate(lastAttendanceDate.getDate() - archivedDaysAgo);
  }

  let attendanceProbability;
  switch (pattern) {
    case "consistent": attendanceProbability = 0.85; break;
    case "regular": attendanceProbability = 0.6; break;
    case "sporadic": attendanceProbability = 0.35; break;
    default: attendanceProbability = 0.5;
  }

  const current = new Date(startDate);
  while (current <= lastAttendanceDate) {
    if (isClassDay(current)) {
      const day = current.getDay();
      const dayProbability = day === 0 ? attendanceProbability * 0.4 : attendanceProbability;

      if (Math.random() < dayProbability) {
        let classType;
        if (day === 0) classType = "nogi";
        else if (day === 1) classType = "nogi";
        else if (day === 3) classType = "gi";
        else classType = "open_mat";

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
  console.log("Seeding mat-tracker database...\n");

  // Clear existing data
  console.log("Clearing existing data...");
  db.run(sql`DELETE FROM attendance`);
  db.run(sql`DELETE FROM promotions`);
  db.run(sql`DELETE FROM notes`);
  db.run(sql`DELETE FROM students`);
  db.run(sql`DELETE FROM settings`);

  // Generate and insert students
  const studentProfiles = generateStudents();
  console.log(`\nCreating ${studentProfiles.length} students...`);

  const studentRecords = [];

  for (const profile of studentProfiles) {
    const id = uuid();
    const now = new Date().toISOString();

    db.run(sql`
      INSERT INTO students (id, first_name, last_name, email, phone, emergency_contact, emergency_phone, start_date, current_belt, current_stripes, is_active, created_at, updated_at)
      VALUES (${id}, ${profile.firstName}, ${profile.lastName}, ${profile.email}, ${profile.phone}, ${profile.emergencyContact}, ${profile.emergencyPhone}, ${formatDate(profile.startDate)}, ${profile.belt}, ${profile.stripes}, ${profile.isActive ? 1 : 0}, ${now}, ${now})
    `);

    studentRecords.push({ id, profile });
    console.log(`  + ${profile.firstName} ${profile.lastName} - ${profile.belt} belt, ${profile.stripes} stripes`);
  }

  // Generate and insert attendance
  console.log("\nGenerating attendance records...");
  let totalAttendance = 0;

  for (const { id, profile } of studentRecords) {
    const attendanceRecords = generateAttendance(id, profile.startDate, profile.pattern, profile.archivedDaysAgo);
    totalAttendance += attendanceRecords.length;

    for (const record of attendanceRecords) {
      db.run(sql`
        INSERT INTO attendance (id, student_id, date, class_type, created_at)
        VALUES (${record.id}, ${record.studentId}, ${record.date}, ${record.classType}, ${record.createdAt})
      `);
    }
  }

  console.log(`  + Created ${totalAttendance} attendance records`);

  // Generate realistic promotion history
  console.log("\nGenerating promotion records...");
  let totalPromotions = 0;

  const beltOrder = ["white", "blue", "purple", "brown", "black"];

  for (const { id, profile } of studentRecords) {
    const promotions = [];
    const startDate = new Date(profile.startDate);
    const today = new Date();

    const currentBeltIndex = beltOrder.indexOf(profile.belt);

    // Work backwards: calculate when current belt was earned based on stripes
    // This ensures time at current belt is realistic
    const daysAtCurrentBelt = profile.stripes * MONTHS_PER_STRIPE[profile.belt] * 30 * (1.1 + Math.random() * 0.3);
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

        // Use minimum time scaled to available time, with some variance
        const monthsAtBelt = MIN_MONTHS_FOR_BELT[toBelt] * scaleFactor * (0.9 + Math.random() * 0.2);
        cumulativeDays += Math.floor(monthsAtBelt * 30);

        const promoDate = new Date(startDate);
        promoDate.setDate(promoDate.getDate() + cumulativeDays);

        // Don't create promotions in the future
        if (promoDate < today && promoDate < currentBeltPromotionDate) {
          promotions.push({
            fromBelt,
            fromStripes: 4,
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

      db.run(sql`
        INSERT INTO promotions (id, student_id, from_belt, from_stripes, to_belt, to_stripes, promoted_at, notes)
        VALUES (${uuid()}, ${id}, ${promo.fromBelt}, ${promo.fromStripes}, ${promo.toBelt}, ${promo.toStripes}, ${formatDate(promo.date)}, ${notes})
      `);

      totalPromotions++;
    }
  }

  console.log(`  + Created ${totalPromotions} promotion records`);
  console.log("\nSeeding complete!");

  sqlite.close();
}

seed().catch(console.error);
