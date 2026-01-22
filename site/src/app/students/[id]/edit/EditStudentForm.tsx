"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BELTS, type Belt } from "@/lib/db/schema";
import { BELT_LABELS } from "@/lib/constants";
import { getPromotionWarning } from "@/lib/promotionValidation";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  startDate: string;
  currentBelt: Belt;
  currentStripes: number;
}

interface EditStudentFormProps {
  student: Student;
  action: (formData: FormData) => Promise<void>;
}

export function EditStudentForm({ student, action }: EditStudentFormProps) {
  const [currentBelt, setCurrentBelt] = useState<Belt>(student.currentBelt);
  const [currentStripes, setCurrentStripes] = useState(student.currentStripes);
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset confirmation state after 3 seconds
  useEffect(() => {
    if (!confirming) return;
    const timeout = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timeout);
  }, [confirming]);

  // Check if the belt/stripe change is non-standard
  const warning = getPromotionWarning(
    student.currentBelt,
    student.currentStripes,
    currentBelt,
    currentStripes
  );

  const handleSubmit = (e: React.FormEvent) => {
    if (warning && !confirming) {
      e.preventDefault();
      setConfirming(true);
    }
    // If confirming is true or no warning, let the form submit normally
  };

  const handleBeltChange = (newBelt: Belt) => {
    if (newBelt !== currentBelt) {
      setCurrentStripes(0); // Reset stripes when belt changes
    }
    setCurrentBelt(newBelt);
    setConfirming(false); // Reset confirmation when selection changes
  };

  const handleStripesChange = (newStripes: number) => {
    setCurrentStripes(newStripes);
    setConfirming(false); // Reset confirmation when selection changes
  };

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <input type="hidden" name="id" value={student.id} />

      <div className="space-y-6">
        {/* Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              defaultValue={student.firstName}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              defaultValue={student.lastName}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={student.email || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              defaultValue={student.phone || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="emergencyContact"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Emergency Contact
            </label>
            <input
              type="text"
              id="emergencyContact"
              name="emergencyContact"
              defaultValue={student.emergencyContact || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="emergencyPhone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Emergency Phone
            </label>
            <input
              type="tel"
              id="emergencyPhone"
              name="emergencyPhone"
              defaultValue={student.emergencyPhone || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            required
            defaultValue={student.startDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Belt and Stripes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="currentBelt"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Belt
            </label>
            <select
              id="currentBelt"
              name="currentBelt"
              value={currentBelt}
              onChange={(e) => handleBeltChange(e.target.value as Belt)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {BELTS.map((belt) => (
                <option key={belt} value={belt}>
                  {BELT_LABELS[belt]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="currentStripes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Stripes
            </label>
            <select
              id="currentStripes"
              name="currentStripes"
              value={currentStripes}
              onChange={(e) => handleStripesChange(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} stripe{n !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Warning for non-standard changes */}
        {warning && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">{warning}</p>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <button
          type="submit"
          className={
            confirming
              ? "flex-1 bg-yellow-500 text-white py-2 px-4 rounded-md font-semibold hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              : "flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          }
        >
          {confirming ? "Tap again to confirm" : "Save Changes"}
        </button>
        <Link
          href={`/students/${student.id}`}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center justify-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
