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

    let belt, stripes, minDaysAgo, maxDaysAgo;

    if (i < 2) {
      belt = "black";
      stripes = Math.floor(Math.random() * 3);
      minDaysAgo = 3650;
      maxDaysAgo = 5475;
    } else if (i < 4) {
      belt = "brown";
      stripes = Math.floor(Math.random() * 5);
      minDaysAgo = 2190;
      maxDaysAgo = 3285;
    } else if (i < 8) {
      belt = "purple";
      stripes = Math.floor(Math.random() * 5);
      minDaysAgo = 1460;
      maxDaysAgo = 2190;
    } else if (i < 14) {
      belt = "blue";
      stripes = Math.floor(Math.random() * 5);
      minDaysAgo = 548;
      maxDaysAgo = 1460;
    } else {
      belt = "white";
      stripes = Math.floor(Math.random() * 5);
      minDaysAgo = 60;
      maxDaysAgo = 548;
    }

    const daysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo)) + minDaysAgo;
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

  // Generate promotion records
  console.log("\nGenerating promotion records...");
  let totalPromotions = 0;

  for (const { id, profile } of studentRecords) {
    if (profile.belt === "white" && profile.stripes === 0) continue;

    const daysAgo = 30 + Math.floor(Math.random() * 150);
    const promotionDate = new Date();
    promotionDate.setDate(promotionDate.getDate() - daysAgo);

    db.run(sql`
      INSERT INTO promotions (id, student_id, from_belt, from_stripes, to_belt, to_stripes, promoted_at, notes)
      VALUES (${uuid()}, ${id}, ${profile.belt}, ${profile.stripes}, ${profile.belt}, ${profile.stripes}, ${formatDate(promotionDate)}, 'Baseline promotion (seeded data)')
    `);

    totalPromotions++;
  }

  console.log(`  + Created ${totalPromotions} promotion records`);
  console.log("\nSeeding complete!");

  sqlite.close();
}

seed().catch(console.error);
