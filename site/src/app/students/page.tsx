import Link from "next/link";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { BeltDisplay } from "@/components/BeltDisplay";

async function getStudents(showArchived: boolean) {
  return db
    .select()
    .from(students)
    .where(eq(students.isActive, !showArchived))
    .orderBy(asc(students.lastName), asc(students.firstName));
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const params = await searchParams;
  const showArchived = params.view === "archived";
  const allStudents = await getStudents(showArchived);

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
                Students
              </h1>
              {!showArchived && (
                <Link
                  href="/students/new"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 self-start sm:self-auto"
                >
                  Add Student
                </Link>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Link
              href="/students"
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                !showArchived
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              Active
            </Link>
            <Link
              href="/students?view=archived"
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                showArchived
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              Archived
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {allStudents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">
              {showArchived ? "No archived students" : "No students yet"}
            </p>
            {!showArchived && (
              <Link
                href="/students/new"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Add your first student
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Belt
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/students/${student.id}`}
                        className="text-gray-900 font-medium hover:text-blue-600"
                      >
                        {student.firstName} {student.lastName}
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <BeltDisplay
                        belt={student.currentBelt}
                        stripes={student.currentStripes}
                        size="sm"
                      />
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.startDate}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.email || student.phone || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
