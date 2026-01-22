import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  students,
  attendance,
  promotions,
  notes,
  BELTS,
  type Belt,
} from "@/lib/db/schema";
import { eq, desc, gte, and } from "drizzle-orm";
import { BeltDisplay } from "@/components/BeltDisplay";
import { ArchiveButton } from "@/components/ArchiveButton";
import { MonthlyCalendar } from "@/components/MonthlyCalendar";
import { BELT_LABELS, NOTE_CATEGORY_LABELS } from "@/lib/constants";
import { getStudentPromotionStatus, getNextBelt, formatTimeAtBelt } from "@/lib/promotionStats";
import { getLocalDateString, getLocalDateStringYearsAgo } from "@/lib/dateUtils";
import { actionLogger } from "@/lib/logger";

function AttendanceCalendars({ attendanceDates }: { attendanceDates: string[] }) {
  const dateSet = new Set(attendanceDates);
  const today = new Date();
  const months: { year: number; month: number }[] = [];

  // Generate last 12 months (most recent first)
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({ year: date.getFullYear(), month: date.getMonth() });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {months.map(({ year, month }) => (
        <MonthlyCalendar
          key={`${year}-${month}`}
          year={year}
          month={month}
          attendanceDates={dateSet}
        />
      ))}
    </div>
  );
}

async function getStudent(id: string) {
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, id));
  return student;
}

async function getStudentAttendance(studentId: string) {
  const oneYearAgoStr = getLocalDateStringYearsAgo(1);

  return db
    .select({ date: attendance.date })
    .from(attendance)
    .where(
      and(
        eq(attendance.studentId, studentId),
        gte(attendance.date, oneYearAgoStr)
      )
    )
    .orderBy(desc(attendance.date));
}

async function getStudentPromotions(studentId: string) {
  return db
    .select()
    .from(promotions)
    .where(eq(promotions.studentId, studentId))
    .orderBy(desc(promotions.promotedAt));
}

async function getStudentNotes(studentId: string) {
  return db
    .select()
    .from(notes)
    .where(eq(notes.studentId, studentId))
    .orderBy(desc(notes.createdAt));
}

async function promoteStudent(formData: FormData) {
  "use server";

  const studentId = formData.get("studentId") as string;
  const fromBelt = formData.get("fromBelt") as Belt;
  const fromStripes = parseInt(formData.get("fromStripes") as string);
  const toBelt = formData.get("toBelt") as Belt;
  const toStripes = parseInt(formData.get("toStripes") as string);
  const promotionNotes = (formData.get("notes") as string) || null;
  const today = getLocalDateString();

  try {
    // Record the promotion
    await db.insert(promotions).values({
      studentId,
      fromBelt,
      fromStripes,
      toBelt,
      toStripes,
      promotedAt: today,
      notes: promotionNotes,
    });

    // Update the student's current belt/stripes
    await db
      .update(students)
      .set({
        currentBelt: toBelt,
        currentStripes: toStripes,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(students.id, studentId));

    actionLogger.info(
      { action: "promoteStudent", entityType: "student", entityId: studentId, fromBelt, fromStripes, toBelt, toStripes },
      `Student promoted from ${fromBelt}/${fromStripes} to ${toBelt}/${toStripes}`
    );
  } catch (error) {
    actionLogger.error(
      { action: "promoteStudent", entityType: "student", entityId: studentId, error: error instanceof Error ? error.message : error },
      "Failed to promote student"
    );
    throw error;
  }

  redirect(`/students/${studentId}`);
}

async function archiveStudent(formData: FormData) {
  "use server";

  const studentId = formData.get("studentId") as string;

  try {
    await db
      .update(students)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(students.id, studentId));

    actionLogger.info(
      { action: "archiveStudent", entityType: "student", entityId: studentId },
      "Student archived"
    );
  } catch (error) {
    actionLogger.error(
      { action: "archiveStudent", entityType: "student", entityId: studentId, error: error instanceof Error ? error.message : error },
      "Failed to archive student"
    );
    throw error;
  }

  redirect("/students");
}

async function unarchiveStudent(formData: FormData) {
  "use server";

  const studentId = formData.get("studentId") as string;

  try {
    await db
      .update(students)
      .set({
        isActive: true,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(students.id, studentId));

    actionLogger.info(
      { action: "unarchiveStudent", entityType: "student", entityId: studentId },
      "Student unarchived"
    );
  } catch (error) {
    actionLogger.error(
      { action: "unarchiveStudent", entityType: "student", entityId: studentId, error: error instanceof Error ? error.message : error },
      "Failed to unarchive student"
    );
    throw error;
  }

  redirect(`/students/${studentId}`);
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudent(id);

  if (!student) {
    notFound();
  }

  const [studentAttendance, studentPromotions, studentNotes, promotionStatus] =
    await Promise.all([
      getStudentAttendance(id),
      getStudentPromotions(id),
      getStudentNotes(id),
      getStudentPromotionStatus(id, student),
    ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/students"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              &larr; Students
            </Link>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                {student.firstName} {student.lastName}
              </h1>
              <div className="flex gap-2">
                <Link
                  href={`/students/${id}/edit`}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                >
                  Edit
                </Link>
                <ArchiveButton
                  studentId={id}
                  isArchived={!student.isActive}
                  action={student.isActive ? archiveStudent : unarchiveStudent}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Belt Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Current Rank
              </h2>
              <div className="flex justify-center mb-4">
                <BeltDisplay
                  belt={student.currentBelt}
                  stripes={student.currentStripes}
                  size="lg"
                />
              </div>
              <p className="text-center text-gray-600">
                {BELT_LABELS[student.currentBelt]} &middot;{" "}
                {student.currentStripes} stripe
                {student.currentStripes !== 1 ? "s" : ""}
              </p>

              {/* Promotion Progress */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">
                    Progress toward next{" "}
                    {promotionStatus.isStripePromotion ? "stripe" : "belt"}
                  </span>
                  {promotionStatus.stripeDue && (
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                      Due for stripe
                    </span>
                  )}
                  {promotionStatus.beltEligible && (
                    <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                      Eligible for belt
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full ${
                      promotionStatus.stripeDue || promotionStatus.beltEligible
                        ? "bg-green-500"
                        : "bg-blue-500"
                    }`}
                    style={{ width: `${promotionStatus.progress}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Classes:</span>{" "}
                    <span className="font-medium">
                      {promotionStatus.classesSincePromotion}
                      {promotionStatus.nextThreshold !== Infinity && (
                        <span className="text-gray-400">
                          {" "}
                          / {promotionStatus.nextThreshold}
                        </span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Time at Belt:</span>{" "}
                    <span className="font-medium">
                      {formatTimeAtBelt(promotionStatus.daysAtBelt)}
                    </span>
                  </div>
                </div>

                {promotionStatus.lastPromotionDate && (
                  <p className="mt-2 text-xs text-gray-400">
                    Since {promotionStatus.lastPromotionDate}
                  </p>
                )}
              </div>

              {/* Rank Update Form */}
              <form action={promoteStudent} className="mt-4 pt-4 border-t">
                <input type="hidden" name="studentId" value={id} />
                <input
                  type="hidden"
                  name="fromBelt"
                  value={student.currentBelt}
                />
                <input
                  type="hidden"
                  name="fromStripes"
                  value={student.currentStripes}
                />

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Belt
                      </label>
                      <select
                        name="toBelt"
                        defaultValue={student.currentBelt}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        {BELTS.map((belt) => (
                          <option key={belt} value={belt}>
                            {BELT_LABELS[belt]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Stripes
                      </label>
                      <select
                        name="toStripes"
                        defaultValue={student.currentStripes}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        {[0, 1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <input
                    type="text"
                    name="notes"
                    placeholder="Notes (optional)"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm font-semibold hover:bg-blue-500"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Info
              </h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd className="text-gray-900">{student.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="text-gray-900">{student.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Emergency Contact</dt>
                  <dd className="text-gray-900">
                    {student.emergencyContact || "—"}
                    {student.emergencyPhone && ` (${student.emergencyPhone})`}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Training Since</dt>
                  <dd className="text-gray-900">{student.startDate}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance Calendars */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Attendance ({studentAttendance.length} classes this year)
                </h2>
              </div>
              <div className="p-4">
                {studentAttendance.length === 0 ? (
                  <p className="text-gray-500">No attendance records</p>
                ) : (
                  <AttendanceCalendars
                    attendanceDates={studentAttendance.map((r) => r.date)}
                  />
                )}
              </div>
            </div>

            {/* Promotions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Promotion History
                </h2>
              </div>
              <ul className="divide-y divide-gray-200">
                {studentPromotions.length === 0 ? (
                  <li className="px-6 py-4 text-gray-500">
                    No promotions yet
                  </li>
                ) : (
                  studentPromotions.map((promo) => (
                    <li key={promo.id} className="px-6 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">
                            {BELT_LABELS[promo.fromBelt]} ({promo.fromStripes}{" "}
                            stripes)
                          </span>
                          <span className="mx-2">&rarr;</span>
                          <span className="font-medium">
                            {BELT_LABELS[promo.toBelt]} ({promo.toStripes}{" "}
                            stripes)
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {promo.promotedAt}
                        </span>
                      </div>
                      {promo.notes && (
                        <p className="mt-1 text-sm text-gray-600">
                          {promo.notes}
                        </p>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                <Link
                  href={`/students/${id}/notes/new`}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Add Note
                </Link>
              </div>
              <ul className="divide-y divide-gray-200">
                {studentNotes.length === 0 ? (
                  <li className="px-6 py-4 text-gray-500">No notes yet</li>
                ) : (
                  studentNotes.map((note) => (
                    <li key={note.id} className="px-6 py-4">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {NOTE_CATEGORY_LABELS[note.category]}
                        </span>
                        <span className="text-sm text-gray-500">
                          {note.createdAt.split("T")[0]}
                        </span>
                      </div>
                      <p className="text-gray-900">{note.content}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
