import type { Belt } from "@/lib/db/schema";
import { BELT_COLORS } from "@/lib/constants";

interface BeltDisplayProps {
  belt: Belt;
  stripes: number;
  size?: "sm" | "md" | "lg";
}

export function BeltDisplay({ belt, stripes, size = "md" }: BeltDisplayProps) {
  const colors = BELT_COLORS[belt];

  const sizeClasses = {
    sm: "h-4 w-24",
    md: "h-6 w-32",
    lg: "h-8 w-48",
  };

  const stripeClasses = {
    sm: "h-4 w-1",
    md: "h-6 w-1.5",
    lg: "h-8 w-2",
  };

  const gapClasses = {
    sm: "gap-1 px-1.5",
    md: "gap-1.5 px-2",
    lg: "gap-2 px-3",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colors.bg} rounded-sm relative shadow-sm ring-1 ring-black/10`}
    >
      {/* Stripe section - red for black belts, black for others */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-2/5 ${belt === "black" ? "bg-red-600" : "bg-black"} rounded-r-sm flex items-center justify-end ${gapClasses[size]}`}
      >
        {Array.from({ length: stripes }).map((_, i) => (
          <div
            key={i}
            className={`${stripeClasses[size]} bg-white rounded-sm`}
          />
        ))}
      </div>
    </div>
  );
}
