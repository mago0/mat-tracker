import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { students, promotions, BELTS, type Belt } from "@/lib/db/schema";
import { BELT_LABELS } from "@/lib/constants";
import { NewStudentForm } from "./NewStudentForm";

async function createStudent(formData: FormData) {
  "use server";

  const currentBelt = (formData.get("currentBelt") as Belt) || "white";
  const currentStripes = parseInt(formData.get("currentStripes") as string) || 0;
  const lastPromotedDate = formData.get("lastPromotedDate") as string | null;

  const data = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    emergencyContact: (formData.get("emergencyContact") as string) || null,
    emergencyPhone: (formData.get("emergencyPhone") as string) || null,
    startDate: formData.get("startDate") as string,
    currentBelt,
    currentStripes,
  };

  const [newStudent] = await db.insert(students).values(data).returning({ id: students.id });

  // If a last promoted date was provided and student isn't a fresh white belt,
  // create a baseline promotion record
  const isNotFreshWhiteBelt = currentBelt !== "white" || currentStripes > 0;
  if (lastPromotedDate && isNotFreshWhiteBelt && newStudent) {
    await db.insert(promotions).values({
      studentId: newStudent.id,
      fromBelt: currentBelt, // Same belt (baseline record)
      fromStripes: currentStripes,
      toBelt: currentBelt,
      toStripes: currentStripes,
      promotedAt: lastPromotedDate,
      notes: "Baseline promotion (pre-existing rank at onboarding)",
    });
  }

  redirect("/students");
}

export default function NewStudentPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/students" className="text-gray-500 hover:text-gray-700">
              &larr; Students
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Add Student
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <NewStudentForm action={createStudent} />
      </main>
    </div>
  );
}
