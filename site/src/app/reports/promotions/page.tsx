import Link from "next/link";
import { getAllStudentsPromotionStatus } from "@/lib/promotionStats";
import { BELTS, type Belt } from "@/lib/db/schema";
import { BELT_LABELS } from "@/lib/constants";
import { BeltDisplay } from "@/components/BeltDisplay";
import { PromotionsTable } from "./PromotionsTable";

// Force dynamic rendering - data changes frequently
export const dynamic = "force-dynamic";

export default async function PromotionsReportPage() {
  const studentsWithStatus = await getAllStudentsPromotionStatus();

  // Calculate summary stats
  const stripeDueCount = studentsWithStatus.filter(
    (s) => s.status.stripeDue
  ).length;
  const beltEligibleCount = studentsWithStatus.filter(
    (s) => s.status.beltEligible
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              &larr; Dashboard
            </Link>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Promotion Status
              </h1>
              <Link
                href="/settings"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Adjust thresholds
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
          <div className="rounded-lg bg-white p-6 shadow">
            <dt className="text-sm font-medium text-gray-500">
              Total Active Students
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {studentsWithStatus.length}
            </dd>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <dt className="text-sm font-medium text-gray-500">Due for Stripe</dt>
            <dd className="mt-1 text-3xl font-semibold text-green-600">
              {stripeDueCount}
            </dd>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <dt className="text-sm font-medium text-gray-500">
              Eligible for Belt
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-600">
              {beltEligibleCount}
            </dd>
          </div>
        </div>

        {/* Table */}
        <PromotionsTable studentsWithStatus={studentsWithStatus} />
      </main>
    </div>
  );
}
