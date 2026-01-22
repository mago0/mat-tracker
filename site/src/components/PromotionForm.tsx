"use client";

import { useState, useRef, useEffect } from "react";
import { BELTS, type Belt } from "@/lib/db/schema";
import { BELT_LABELS } from "@/lib/constants";
import { getPromotionWarning } from "@/lib/promotionValidation";

interface PromotionFormProps {
  studentId: string;
  currentBelt: Belt;
  currentStripes: number;
  action: (formData: FormData) => Promise<void>;
}

export function PromotionForm({
  studentId,
  currentBelt,
  currentStripes,
  action,
}: PromotionFormProps) {
  const [toBelt, setToBelt] = useState<Belt>(currentBelt);
  const [toStripes, setToStripes] = useState(currentStripes);
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset confirmation state after 3 seconds
  useEffect(() => {
    if (!confirming) return;
    const timeout = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timeout);
  }, [confirming]);

  // Check if the promotion is non-standard
  const warning = getPromotionWarning(currentBelt, currentStripes, toBelt, toStripes);

  // Check if there's actually a change
  const hasChange = toBelt !== currentBelt || toStripes !== currentStripes;

  const handleSubmit = (e: React.FormEvent) => {
    if (warning && !confirming) {
      e.preventDefault();
      setConfirming(true);
    }
    // If confirming is true or no warning, let the form submit normally
  };

  const handleBeltChange = (newBelt: Belt) => {
    if (newBelt !== toBelt) {
      setToStripes(0); // Reset stripes when belt changes
    }
    setToBelt(newBelt);
    setConfirming(false); // Reset confirmation when selection changes
  };

  const handleStripesChange = (newStripes: number) => {
    setToStripes(newStripes);
    setConfirming(false); // Reset confirmation when selection changes
  };

  return (
    <form ref={formRef} action={action} onSubmit={handleSubmit} className="mt-4 pt-4 border-t">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="fromBelt" value={currentBelt} />
      <input type="hidden" name="fromStripes" value={currentStripes} />

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Belt</label>
            <select
              name="toBelt"
              value={toBelt}
              onChange={(e) => handleBeltChange(e.target.value as Belt)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            >
              {BELTS.map((belt) => (
                <option key={belt} value={belt}>
                  {BELT_LABELS[belt]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Stripes</label>
            <select
              name="toStripes"
              value={toStripes}
              onChange={(e) => handleStripesChange(parseInt(e.target.value))}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            >
              {[0, 1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Warning for non-standard promotion */}
        {warning && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            {warning}
          </div>
        )}

        <input
          type="text"
          name="notes"
          placeholder="Notes (optional)"
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
        />
        <button
          type="submit"
          disabled={!hasChange}
          className={
            !hasChange
              ? "w-full bg-gray-300 text-gray-500 py-2 px-4 rounded text-sm font-semibold cursor-not-allowed"
              : confirming
                ? "w-full bg-yellow-500 text-white py-2 px-4 rounded text-sm font-semibold hover:bg-yellow-400"
                : "w-full bg-blue-600 text-white py-2 px-4 rounded text-sm font-semibold hover:bg-blue-500"
          }
        >
          {confirming ? "Tap again to confirm" : "Update"}
        </button>
      </div>
    </form>
  );
}
