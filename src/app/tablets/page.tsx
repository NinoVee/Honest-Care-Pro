import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function TabletsPage() {
  const tablets = await db.tablet.findMany({
    include: { currentPatient: true },
    orderBy: { identifier: "asc" },
  });

  const available = tablets.filter((t) => t.status === "AVAILABLE").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Tablet Inventory</h1>
        <p className="text-sm text-subtle">{available} of {tablets.length} available</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {tablets.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="font-medium text-ink">{t.identifier}</div>
            <span className={`pill mt-2 inline-block ${
              t.status === "AVAILABLE" ? "bg-alert-good/10 text-alert-good" :
              t.status === "ASSIGNED" ? "bg-teal-light text-teal" : "bg-alert-urgent/10 text-alert-urgent"
            }`}>
              {t.status}
            </span>
            {t.currentPatient && (
              <p className="mt-2 text-xs text-subtle">{t.currentPatient.firstName} {t.currentPatient.lastName}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}