"use client";

import { useState } from "react";
import Link from "next/link";
import { BELTS, type Belt } from "@/lib/db/schema";
import { BELT_LABELS } from "@/lib/constants";

interface NewStudentFormProps {
  action: (formData: FormData) => Promise<void>;
}

export function NewStudentForm({ action }: NewStudentFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [currentBelt, setCurrentBelt] = useState<Belt>("white");
  const [currentStripes, setCurrentStripes] = useState(0);

  // Show last promoted date field if student is not a fresh white belt
  const showLastPromotedDate = currentBelt !== "white" || currentStripes > 0;

  return (
    <form action={action} className="bg-white rounded-lg shadow p-6">
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
            defaultValue={today}
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
              onChange={(e) => setCurrentBelt(e.target.value as Belt)}
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
              onChange={(e) => setCurrentStripes(parseInt(e.target.value))}
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

        {/* Last Promoted Date - shown only for non-fresh white belts */}
        {showLastPromotedDate && (
          <div className="p-4 bg-blue-50 rounded-md">
            <label
              htmlFor="lastPromotedDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Date of Last Promotion
            </label>
            <input
              type="date"
              id="lastPromotedDate"
              name="lastPromotedDate"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              When did this student receive their current rank? This is used to
              track attendance toward their next promotion. Leave blank to count
              from their start date.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Student
        </button>
        <Link
          href="/students"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
