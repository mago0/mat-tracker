import Link from "next/link";
import { db } from "@/lib/db";
import { students, attendance } from "@/lib/db/schema";
import { eq, desc, gte, and, count } from "drizzle-orm";
import { getLocalDateString, getLocalDateStringDaysAgo } from "@/lib/dateUtils";

async function getStats() {
  const today = getLocalDateString();
  const weekAgo = getLocalDateStringDaysAgo(7);

  const [activeStudents] = await db
    .select({ count: count() })
    .from(students)
    .where(eq(students.isActive, true));

  const [todayAttendance] = await db
    .select({ count: count() })
    .from(attendance)
    .where(eq(attendance.date, today));

  const [weeklyAttendance] = await db
    .select({ count: count() })
    .from(attendance)
    .where(gte(attendance.date, weekAgo));

  const recentCheckins = await db
    .select({
      id: attendance.id,
      date: attendance.date,
      classType: attendance.classType,
      studentId: attendance.studentId,
      firstName: students.firstName,
      lastName: students.lastName,
    })
    .from(attendance)
    .innerJoin(students, eq(attendance.studentId, students.id))
    .orderBy(desc(attendance.createdAt))
    .limit(10);

  return {
    activeStudents: activeStudents?.count ?? 0,
    todayAttendance: todayAttendance?.count ?? 0,
    weeklyAttendance: weeklyAttendance?.count ?? 0,
    recentCheckins,
  };
}

export default async function Dashboard() {
  const stats = await getStats();

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Mat Tracker
            </h1>
            <nav className="flex gap-2 sm:gap-4">
              <Link
                href="/attendance"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 whitespace-nowrap"
              >
                Check In
              </Link>
              <Link
                href="/students"
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Students
              </Link>
              <Link
                href="/reports"
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
              >
                Reports
              </Link>
              <Link
                href="/settings"
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                title="Settings"
              >
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
          <div className="rounded-lg bg-white p-6 shadow">
            <dt className="text-sm font-medium text-gray-500">
              Active Students
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.activeStudents}
            </dd>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <dt className="text-sm font-medium text-gray-500">
              Today&apos;s Check-ins
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.todayAttendance}
            </dd>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <dt className="text-sm font-medium text-gray-500">
              This Week
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.weeklyAttendance}
            </dd>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Check-ins
            </h2>
          </div>
          <ul className="divide-y divide-gray-200">
            {stats.recentCheckins.length === 0 ? (
              <li className="px-6 py-4 text-gray-500">No check-ins yet</li>
            ) : (
              stats.recentCheckins.map((checkin) => (
                <li key={checkin.id} className="px-6 py-4 flex justify-between">
                  <div>
                    <Link
                      href={`/students/${checkin.studentId}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {checkin.firstName} {checkin.lastName}
                    </Link>
                    <span className="ml-2 text-sm text-gray-500">
                      {checkin.classType.replace("_", " ")}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{checkin.date}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
