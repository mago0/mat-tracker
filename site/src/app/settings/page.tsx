import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getPromotionThresholds,
  savePromotionThresholds,
} from "@/lib/promotionStats";
import {
  BELTS,
  type Belt,
  type PromotionThresholds,
} from "@/lib/db/schema";
import { BELT_LABELS } from "@/lib/constants";
import { actionLogger } from "@/lib/logger";

async function saveSettings(formData: FormData) {
  "use server";

  const stripeThresholds: Record<Belt, number> = {
    white: parseInt(formData.get("stripe-white") as string) || 25,
    blue: parseInt(formData.get("stripe-blue") as string) || 30,
    purple: parseInt(formData.get("stripe-purple") as string) || 35,
    brown: parseInt(formData.get("stripe-brown") as string) || 40,
    black: parseInt(formData.get("stripe-black") as string) || 50,
  };

  const beltThresholds: Partial<Record<Belt, number>> = {
    white: parseInt(formData.get("belt-white") as string) || 100,
    blue: parseInt(formData.get("belt-blue") as string) || 150,
    purple: parseInt(formData.get("belt-purple") as string) || 200,
    brown: parseInt(formData.get("belt-brown") as string) || 250,
  };

  const thresholds: PromotionThresholds = {
    stripeThresholds,
    beltThresholds,
  };

  try {
    await savePromotionThresholds(thresholds);
    actionLogger.info(
      { action: "saveSettings", entityType: "settings" },
      "Promotion thresholds updated"
    );
  } catch (error) {
    actionLogger.error(
      { action: "saveSettings", entityType: "settings", error: error instanceof Error ? error.message : error },
      "Failed to save settings"
    );
    throw error;
  }

  redirect("/settings?saved=1");
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const thresholds = await getPromotionThresholds();

  // Belts that can be promoted to next belt (all except black)
  const promotableBelts = BELTS.filter((belt) => belt !== "black");

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
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Settings
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {saved && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              Settings saved successfully
            </p>
          </div>
        )}

        <form action={saveSettings}>
          {/* Stripe Thresholds */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Stripe Thresholds
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Number of classes required before a student is due for their
                next stripe. Students meeting this threshold will show as
                &quot;Due for stripe&quot;.
              </p>
            </div>
            <div className="p-6 space-y-4">
              {BELTS.map((belt) => (
                <div key={belt} className="flex items-center gap-4">
                  <label
                    htmlFor={`stripe-${belt}`}
                    className="w-32 text-sm font-medium text-gray-700"
                  >
                    {BELT_LABELS[belt]}
                  </label>
                  <input
                    type="number"
                    id={`stripe-${belt}`}
                    name={`stripe-${belt}`}
                    min="1"
                    defaultValue={thresholds.stripeThresholds[belt]}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">classes</span>
                </div>
              ))}
            </div>
          </div>

          {/* Belt Thresholds */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Belt Eligibility Thresholds
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Number of classes required before a student at 4 stripes becomes
                eligible for their next belt. This is just one factor in belt
                promotions - students meeting this threshold will show as
                &quot;Eligible for belt&quot;.
              </p>
            </div>
            <div className="p-6 space-y-4">
              {promotableBelts.map((belt) => {
                const nextBelt = BELTS[BELTS.indexOf(belt) + 1];
                return (
                  <div key={belt} className="flex items-center gap-4">
                    <label
                      htmlFor={`belt-${belt}`}
                      className="w-32 text-sm font-medium text-gray-700"
                    >
                      {BELT_LABELS[belt]}
                    </label>
                    <span className="text-gray-400">&rarr;</span>
                    <span className="w-24 text-sm text-gray-600">
                      {BELT_LABELS[nextBelt]}
                    </span>
                    <input
                      type="number"
                      id={`belt-${belt}`}
                      name={`belt-${belt}`}
                      min="1"
                      defaultValue={thresholds.beltThresholds[belt]}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-500">classes</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Settings
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
