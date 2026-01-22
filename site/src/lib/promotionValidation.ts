/**
 * Client-safe promotion validation utilities.
 * This file should NOT import any database-related code.
 */

// Belt order (duplicated here to avoid importing from schema.ts which has db code)
const BELTS = ["white", "blue", "purple", "brown", "black"] as const;
type Belt = (typeof BELTS)[number];

/**
 * Check if a promotion follows the standard BJJ progression.
 * Standard promotions are:
 * 1. Stripe increment: same belt, stripes +1 (e.g., Blue 2 → Blue 3)
 * 2. Belt promotion: at 4 stripes, next belt at 0 stripes (e.g., Blue 4 → Purple 0)
 *
 * Returns null if standard, or a warning message if non-standard.
 */
export function getPromotionWarning(
  fromBelt: Belt,
  fromStripes: number,
  toBelt: Belt,
  toStripes: number
): string | null {
  // No change at all
  if (fromBelt === toBelt && fromStripes === toStripes) {
    return null;
  }

  const fromBeltIndex = BELTS.indexOf(fromBelt);
  const toBeltIndex = BELTS.indexOf(toBelt);

  // Standard stripe increment: same belt, stripes +1
  if (fromBelt === toBelt && toStripes === fromStripes + 1) {
    return null;
  }

  // Standard belt promotion: at 4 stripes, next belt at 0 stripes
  if (fromStripes === 4 && toBeltIndex === fromBeltIndex + 1 && toStripes === 0) {
    return null;
  }

  // Everything else is non-standard - generate a warning message
  const warnings: string[] = [];

  // Going backwards in belt
  if (toBeltIndex < fromBeltIndex) {
    warnings.push(`moving backwards from ${fromBelt} to ${toBelt} belt`);
  }

  // Skipping belts forward
  if (toBeltIndex > fromBeltIndex + 1) {
    const skippedBelts = BELTS.slice(fromBeltIndex + 1, toBeltIndex).join(", ");
    warnings.push(`skipping ${skippedBelts} belt${toBeltIndex - fromBeltIndex > 2 ? "s" : ""}`);
  }

  // Belt promotion without 4 stripes
  if (toBeltIndex > fromBeltIndex && fromStripes < 4) {
    warnings.push(`promoting to next belt without 4 stripes (currently at ${fromStripes})`);
  }

  // New belt with stripes > 0
  if (toBeltIndex !== fromBeltIndex && toStripes > 0) {
    warnings.push(`new belt starting with ${toStripes} stripe${toStripes !== 1 ? "s" : ""} instead of 0`);
  }

  // Skipping stripes on same belt
  if (fromBelt === toBelt && toStripes > fromStripes + 1) {
    warnings.push(`skipping ${toStripes - fromStripes - 1} stripe${toStripes - fromStripes > 2 ? "s" : ""}`);
  }

  // Going backwards in stripes on same belt
  if (fromBelt === toBelt && toStripes < fromStripes) {
    warnings.push(`reducing stripes from ${fromStripes} to ${toStripes}`);
  }

  if (warnings.length === 0) {
    return null;
  }

  return `This is a non-standard promotion: ${warnings.join(", ")}. Are you sure?`;
}
