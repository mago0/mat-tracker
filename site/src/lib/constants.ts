import type { Belt, ClassType, NoteCategory } from "./db/schema";

export const BELT_COLORS: Record<Belt, { bg: string; text: string }> = {
  white: { bg: "bg-white border border-gray-300", text: "text-gray-900" },
  blue: { bg: "bg-blue-600", text: "text-white" },
  purple: { bg: "bg-purple-600", text: "text-white" },
  brown: { bg: "bg-amber-800", text: "text-white" },
  black: { bg: "bg-black", text: "text-white" },
};

export const BELT_LABELS: Record<Belt, string> = {
  white: "White Belt",
  blue: "Blue Belt",
  purple: "Purple Belt",
  brown: "Brown Belt",
  black: "Black Belt",
};

export const CLASS_TYPE_LABELS: Record<ClassType, string> = {
  gi: "Gi",
  nogi: "No-Gi",
  open_mat: "Open Mat",
};

export const NOTE_CATEGORY_LABELS: Record<NoteCategory, string> = {
  general: "General",
  technique: "Technique Focus",
  injury: "Injury/Limitation",
  goals: "Goals",
};
