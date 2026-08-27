"use client";

import { useTransition } from "react";

export function ConfirmRemovePatientButton({
  patientId,
  patientName,
  action,
}: {
  patientId: string;
  patientName: string;
  action: (patientId: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Remove ${patientName} from the program? Their assigned kit (if any) will be freed and they'll no longer appear in the active patient list. All of their records remain in the database — nothing is deleted.`
    );
    if (!confirmed) return;
    startTransition(() => {
      action(patientId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="btn-secondary text-xs text-alert-critical"
    >
      {isPending ? "Removing…" : "Remove Patient from Program"}
    </button>
  );
}