import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { students, attendance, type ClassType } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { BeltDisplay } from "@/components/BeltDisplay";
import { AttendanceFilters } from "@/components/AttendanceFilters";
import { getLocalDateString } from "@/lib/dateUtils";

async function getActiveStudents() {
  return db
    .select()
    .from(students)
    .where(eq(students.isActive, true))
    .orderBy(students.lastName, students.firstName);
}

async function getTodayAttendance(date: string) {
  return db
    .select({
      studentId: attendance.studentId,
      classType: attendance.classType,
    })
    .from(attendance)
    .where(eq(attendance.date, date));
}

async function checkIn(formData: FormData) {
  "use server";

  const studentId = formData.get("studentId") as string;
  const classType = formData.get("classType") as ClassType;
  const date = formData.get("date") as string;

  // Check if already checked in today for this class type
  const [existing] = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.studentId, studentId),
        eq(attendance.date, date),
        eq(attendance.classType, classType)
      )
    );

  if (!existing) {
    await db.insert(attendance).values({
      studentId,
      date,
      classType,
    });
  }

  redirect(`/attendance?date=${date}&classType=${classType}`);
}

async function removeCheckIn(formData: FormData) {
  "use server";

  const studentId = formData.get("studentId") as string;
  const classType = formData.get("classType") as ClassType;
  const date = formData.get("date") as string;

  await db
    .delete(attendance)
    .where(
      and(
        eq(attendance.studentId, studentId),
        eq(attendance.date, date),
        eq(attendance.classType, classType)
      )
    );

  redirect(`/attendance?date=${date}&classType=${classType}`);
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; classType?: string }>;
}) {
  const params = await searchParams;
  const today = getLocalDateString();
  const selectedDate = params.date || today;

  const [allStudents, dayCheckins] = await Promise.all([
    getActiveStudents(),
    getTodayAttendance(selectedDate),
  ]);

  // Default to class type that already has attendance, or "gi" if none
  const existingClassType = dayCheckins.length > 0 ? dayCheckins[0].classType : null;
  const selectedClassType = params.classType || existingClassType || "gi";

  const checkedInIds = new Set(
    dayCheckins
      .filter((c) => c.classType === selectedClassType)
      .map((c) => c.studentId)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              &larr; Dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Attendance
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <AttendanceFilters
          selectedDate={selectedDate}
          selectedClassType={selectedClassType}
          checkedInCount={checkedInIds.size}
          totalCount={allStudents.length}
        />

        {/* Student List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {allStudents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No active students.{" "}
              <Link href="/students/new" className="text-blue-600">
                Add a student
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {allStudents.map((student) => {
                const isCheckedIn = checkedInIds.has(student.id);
                return (
                  <li
                    key={student.id}
                    className={`px-4 py-3 sm:px-6 sm:py-4 flex items-center gap-3 sm:gap-4 ${
                      isCheckedIn ? "bg-green-50" : ""
                    }`}
                  >
                    <BeltDisplay
                      belt={student.currentBelt}
                      stripes={student.currentStripes}
                      size="sm"
                    />
                    <Link
                      href={`/students/${student.id}`}
                      className="flex-1 min-w-0 font-medium text-gray-900 hover:text-blue-600 truncate"
                    >
                      {student.firstName} {student.lastName}
                    </Link>

                    {isCheckedIn ? (
                      <form action={removeCheckIn}>
                        <input
                          type="hidden"
                          name="studentId"
                          value={student.id}
                        />
                        <input
                          type="hidden"
                          name="classType"
                          value={selectedClassType}
                        />
                        <input type="hidden" name="date" value={selectedDate} />
                        <button
                          type="submit"
                          className="shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 whitespace-nowrap"
                        >
                          Checked In
                        </button>
                      </form>
                    ) : (
                      <form action={checkIn}>
                        <input
                          type="hidden"
                          name="studentId"
                          value={student.id}
                        />
                        <input
                          type="hidden"
                          name="classType"
                          value={selectedClassType}
                        />
                        <input type="hidden" name="date" value={selectedDate} />
                        <button
                          type="submit"
                          className="shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 whitespace-nowrap"
                        >
                          Check In
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
