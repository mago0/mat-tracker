"use client";

import { useRouter } from "next/navigation";
import { CLASS_TYPES } from "@/lib/db/schema";
import { CLASS_TYPE_LABELS } from "@/lib/constants";

interface AttendanceFiltersProps {
  selectedDate: string;
  selectedClassType: string;
  checkedInCount: number;
  totalCount: number;
}

export function AttendanceFilters({
  selectedDate,
  selectedClassType,
  checkedInCount,
  totalCount,
}: AttendanceFiltersProps) {
  const router = useRouter();

  function updateFilters(date: string, classType: string) {
    router.push(`/attendance?date=${date}&classType=${classType}`);
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={selectedDate}
            onChange={(e) => updateFilters(e.target.value, selectedClassType)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="classType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Class Type
          </label>
          <select
            id="classType"
            name="classType"
            value={selectedClassType}
            onChange={(e) => updateFilters(selectedDate, e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CLASS_TYPES.map((type) => (
              <option key={type} value={type}>
                {CLASS_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-500">
          {checkedInCount} of {totalCount} checked in
        </div>
      </div>
    </div>
  );
}
