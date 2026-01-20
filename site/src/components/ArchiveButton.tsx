"use client";

interface ArchiveButtonProps {
  studentId: string;
  isArchived: boolean;
  action: (formData: FormData) => Promise<void>;
}

export function ArchiveButton({ studentId, isArchived, action }: ArchiveButtonProps) {
  return (
    <form action={action}>
      <input type="hidden" name="studentId" value={studentId} />
      <button
        type="submit"
        className={
          isArchived
            ? "rounded-md bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
            : "rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
        }
        onClick={(e) => {
          if (!confirm(isArchived ? "Restore this student?" : "Archive this student?")) {
            e.preventDefault();
          }
        }}
      >
        {isArchived ? "Unarchive" : "Archive"}
      </button>
    </form>
  );
}
