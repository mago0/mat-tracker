"use client";

import { useState, useRef, useEffect } from "react";

interface ArchiveButtonProps {
  studentId: string;
  isArchived: boolean;
  action: (formData: FormData) => Promise<void>;
}

export function ArchiveButton({ studentId, isArchived, action }: ArchiveButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!confirming) return;
    const timeout = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timeout);
  }, [confirming]);

  const handleClick = () => {
    if (confirming) {
      formRef.current?.requestSubmit();
    } else {
      setConfirming(true);
    }
  };

  return (
    <form ref={formRef} action={action}>
      <input type="hidden" name="studentId" value={studentId} />
      <button
        type="button"
        className={
          confirming
            ? "rounded-md bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-800 hover:bg-yellow-200"
            : isArchived
              ? "rounded-md bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
              : "rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
        }
        onClick={handleClick}
      >
        {confirming
          ? "Tap again to confirm"
          : isArchived
            ? "Unarchive"
            : "Archive"}
      </button>
    </form>
  );
}
