export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SCHEDULED: "bg-alert-info/10 text-alert-info",
    CONFIRMED: "bg-teal-light text-teal",
    COMPLETED: "bg-alert-good/10 text-alert-good",
    MISSED: "bg-alert-critical/10 text-alert-critical",
    CANCELLED: "bg-alert-critical/10 text-alert-critical",
    UNASSIGNED: "bg-alert-urgent/10 text-alert-urgent",
  };
  return (
    <span className={`pill ${styles[status] ?? "bg-black/5 text-subtle"}`}>
      {status.replace("_", " ")}
    </span>
  );
}