import Link from "next/link";
import { db } from "@/lib/db";
import { attendance, students } from "@/lib/db/schema";
import { gte, count, eq, max } from "drizzle-orm";
import { AttendanceHeatmap } from "@/components/AttendanceHeatmap";
import { getLocalDateString, getLocalDateStringYearsAgo, getLocalDateStringDaysAgo } from "@/lib/dateUtils";

// Force dynamic rendering - data changes frequently
export const dynamic = "force-dynamic";

async function getAttendanceData() {
  const oneYearAgoStr = getLocalDateStringYearsAgo(1);

  const data = await db
    .select({
      date: attendance.date,
      count: count(),
    })
    .from(attendance)
    .where(gte(attendance.date, oneYearAgoStr))
    .groupBy(attendance.date);

  // Calculate stats
  const totalClasses = data.reduce((sum, d) => sum + d.count, 0);
  const busiestDay = data.reduce(
    (max, d) => (d.count > max.count ? d : max),
    { date: "", count: 0 }
  );
  const avgPerWeek = Math.round(totalClasses / 52);

  return {
    data,
    stats: {
      totalClasses,
      busiestDay: busiestDay.date
        ? { date: busiestDay.date, count: busiestDay.count }
        : null,
      avgPerWeek,
    },
  };
}

async function getInactiveStudents() {
  const thirtyDaysAgoStr = getLocalDateStringDaysAgo(30);
  const todayStr = getLocalDateString();

  // Get active students with their most recent attendance date
  const studentsWithLastAttendance = await db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      lastAttendance: max(attendance.date),
    })
    .from(students)
    .leftJoin(attendance, eq(students.id, attendance.studentId))
    .where(eq(students.isActive, true))
    .groupBy(students.id);

  // Filter to students inactive for more than 30 days and calculate days inactive
  // Excludes students who have never attended (they're not "inactive", just new)
  const inactiveStudents = studentsWithLastAttendance
    .filter((s) => {
      if (!s.lastAttendance) return false; // Never attended - not inactive, just new
      return s.lastAttendance < thirtyDaysAgoStr;
    })
    .map((s) => {
      const lastDate = new Date(s.lastAttendance!);
      const today = new Date(todayStr);
      const daysInactive = Math.floor(
        (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        lastAttendance: s.lastAttendance,
        daysInactive,
      };
    })
    .sort((a, b) => b.daysInactive - a.daysInactive);

  return inactiveStudents;
}

export default async function ReportsPage() {
  const [{ data, stats }, inactiveStudents] = await Promise.all([
    getAttendanceData(),
    getInactiveStudents(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              &larr; Dashboard
            </Link>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Attendance Reports
              </h1>
              <Link
                href="/reports/promotions"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Promotion Status
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
          <div className="rounded-lg bg-white p-6 shadow">
            <dt className="text-sm font-medium text-gray-500">
              Total Check-ins (1 year)
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.totalClasses}
            </dd>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <dt className="text-sm font-medium text-gray-500">
              Average per Week
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.avgPerWeek}
            </dd>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <dt className="text-sm font-medium text-gray-500">Busiest Day</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.busiestDay ? stats.busiestDay.count : 0}
            </dd>
            {stats.busiestDay && (
              <dd className="text-sm text-gray-500">{stats.busiestDay.date}</dd>
            )}
          </div>
        </div>

        {/* Heatmap */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Attendance Over the Past Year
          </h2>
          <div className="overflow-x-auto">
            <AttendanceHeatmap data={data} />
          </div>
        </div>

        {/* Inactive Students */}
        <div className="rounded-lg bg-white p-6 shadow mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Inactive Students (30+ days)
          </h2>
          {inactiveStudents.length === 0 ? (
            <p className="text-gray-500">
              All active students have checked in within the last 30 days.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {inactiveStudents.map((student) => (
                <li key={student.id} className="py-3">
                  <Link
                    href={`/students/${student.id}`}
                    className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
                  >
                    <span className="font-medium text-gray-900">
                      {student.firstName} {student.lastName}
                    </span>
                    <span className="text-sm text-red-600">
                      {student.daysInactive} days
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
