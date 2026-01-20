"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BeltDisplay } from "@/components/BeltDisplay";
import { BELT_LABELS } from "@/lib/constants";
import { BELTS, type Student, type Belt } from "@/lib/db/schema";
import type { PromotionStatus } from "@/lib/promotionStats";

type StudentWithStatus = {
  student: Student;
  status: PromotionStatus;
};

type SortField = "name" | "belt" | "classes" | "days" | "status";
type SortDirection = "asc" | "desc";
type StatusFilter = "all" | "stripeDue" | "beltEligible" | "inProgress";

interface PromotionsTableProps {
  studentsWithStatus: StudentWithStatus[];
}

export function PromotionsTable({ studentsWithStatus }: PromotionsTableProps) {
  const [sortField, setSortField] = useState<SortField>("status");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [beltFilter, setBeltFilter] = useState<Belt | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filteredAndSorted = useMemo(() => {
    let result = [...studentsWithStatus];

    // Filter by belt
    if (beltFilter !== "all") {
      result = result.filter((s) => s.student.currentBelt === beltFilter);
    }

    // Filter by status
    if (statusFilter === "stripeDue") {
      result = result.filter((s) => s.status.stripeDue);
    } else if (statusFilter === "beltEligible") {
      result = result.filter((s) => s.status.beltEligible);
    } else if (statusFilter === "inProgress") {
      result = result.filter(
        (s) => !s.status.stripeDue && !s.status.beltEligible
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = `${a.student.lastName} ${a.student.firstName}`.localeCompare(
            `${b.student.lastName} ${b.student.firstName}`
          );
          break;
        case "belt":
          const beltOrder = BELTS.indexOf(a.student.currentBelt) - BELTS.indexOf(b.student.currentBelt);
          if (beltOrder !== 0) {
            comparison = beltOrder;
          } else {
            comparison = a.student.currentStripes - b.student.currentStripes;
          }
          break;
        case "classes":
          comparison =
            a.status.classesSincePromotion - b.status.classesSincePromotion;
          break;
        case "days":
          comparison =
            a.status.daysSincePromotion - b.status.daysSincePromotion;
          break;
        case "status":
          // Sort by: beltEligible first, then stripeDue, then in progress
          const statusOrder = (s: StudentWithStatus) => {
            if (s.status.beltEligible) return 2;
            if (s.status.stripeDue) return 1;
            return 0;
          };
          comparison = statusOrder(a) - statusOrder(b);
          if (comparison === 0) {
            // Secondary sort by progress
            comparison = a.status.progress - b.status.progress;
          }
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [studentsWithStatus, sortField, sortDirection, beltFilter, statusFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-blue-600">
            {sortDirection === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap gap-4">
        <div>
          <label
            htmlFor="belt-filter"
            className="block text-xs text-gray-500 mb-1"
          >
            Belt
          </label>
          <select
            id="belt-filter"
            value={beltFilter}
            onChange={(e) => setBeltFilter(e.target.value as Belt | "all")}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
          >
            <option value="all">All Belts</option>
            {BELTS.map((belt) => (
              <option key={belt} value={belt}>
                {BELT_LABELS[belt]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="status-filter"
            className="block text-xs text-gray-500 mb-1"
          >
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
          >
            <option value="all">All</option>
            <option value="stripeDue">Due for Stripe</option>
            <option value="beltEligible">Eligible for Belt</option>
            <option value="inProgress">In Progress</option>
          </select>
        </div>
        <div className="flex-1" />
        <div className="self-end text-sm text-gray-500">
          Showing {filteredAndSorted.length} of {studentsWithStatus.length}{" "}
          students
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader field="name">Name</SortHeader>
              <SortHeader field="belt">Rank</SortHeader>
              <SortHeader field="classes">Classes</SortHeader>
              <SortHeader field="days">Days</SortHeader>
              <SortHeader field="status">Status</SortHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No students match the current filters
                </td>
              </tr>
            ) : (
              filteredAndSorted.map(({ student, status }) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/students/${student.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {student.firstName} {student.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <BeltDisplay
                        belt={student.currentBelt}
                        stripes={student.currentStripes}
                        size="sm"
                      />
                      <span className="text-sm text-gray-600">
                        {student.currentStripes}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="font-medium">
                      {status.classesSincePromotion}
                    </span>
                    {status.nextThreshold !== Infinity && (
                      <span className="text-gray-400">
                        {" "}
                        / {status.nextThreshold}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {status.daysSincePromotion}
                  </td>
                  <td className="px-4 py-3">
                    {status.stripeDue && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Due for stripe
                      </span>
                    )}
                    {status.beltEligible && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Eligible for belt
                      </span>
                    )}
                    {!status.stripeDue && !status.beltEligible && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${status.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {status.progress}%
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
