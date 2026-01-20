import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { students, notes, NOTE_CATEGORIES, type NoteCategory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NOTE_CATEGORY_LABELS } from "@/lib/constants";

async function getStudent(id: string) {
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, id));
  return student;
}

async function addNote(formData: FormData) {
  "use server";

  const studentId = formData.get("studentId") as string;
  const category = formData.get("category") as NoteCategory;
  const content = formData.get("content") as string;

  await db.insert(notes).values({
    studentId,
    category,
    content,
  });

  redirect(`/students/${studentId}`);
}

export default async function NewNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudent(id);

  if (!student) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href={`/students/${id}`}
              className="text-gray-500 hover:text-gray-700"
            >
              &larr; Back
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Add Note for {student.firstName}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <form action={addNote} className="bg-white rounded-lg shadow p-6">
          <input type="hidden" name="studentId" value={id} />

          <div className="space-y-4">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                defaultValue="general"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NOTE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {NOTE_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Note
              </label>
              <textarea
                id="content"
                name="content"
                required
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter note content..."
              />
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Note
            </button>
            <Link
              href={`/students/${id}`}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center justify-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
