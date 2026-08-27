"use client";

import { useTransition } from "react";

export function ConfirmUnassignButton({
  tabletId,
  patientName,
  action,
}: {
  tabletId: string;
  patientName: string;
  action: (tabletId: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Unassign this kit from ${patientName}? The kit will return to the available pool. This does not discharge the patient.`
    );
    if (!confirmed) return;
    startTransition(() => {
      action(tabletId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="btn-secondary mt-2 text-xs text-alert-critical"
    >
      {isPending ? "Unassigning…" : "Unassign"}
    </button>
  );
}