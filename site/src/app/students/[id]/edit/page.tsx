import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { students, type Belt } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { actionLogger } from "@/lib/logger";
import { EditStudentForm } from "./EditStudentForm";

async function getStudent(id: string) {
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.id, id));
  return student;
}

async function updateStudent(formData: FormData) {
  "use server";

  const id = formData.get("id") as string;
  const data = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    emergencyContact: (formData.get("emergencyContact") as string) || null,
    emergencyPhone: (formData.get("emergencyPhone") as string) || null,
    startDate: formData.get("startDate") as string,
    currentBelt: formData.get("currentBelt") as Belt,
    currentStripes: parseInt(formData.get("currentStripes") as string) || 0,
    updatedAt: new Date().toISOString(),
  };

  try {
    await db.update(students).set(data).where(eq(students.id, id));
    actionLogger.info(
      { action: "updateStudent", entityType: "student", entityId: id },
      "Student updated"
    );
  } catch (error) {
    actionLogger.error(
      { action: "updateStudent", entityType: "student", entityId: id, error: error instanceof Error ? error.message : error },
      "Failed to update student"
    );
    throw error;
  }

  redirect(`/students/${id}`);
}

export default async function EditStudentPage({
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
              Edit {student.firstName} {student.lastName}
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <EditStudentForm student={student} action={updateStudent} />
      </main>
    </div>
  );
}
