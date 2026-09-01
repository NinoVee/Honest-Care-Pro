import Link from "next/link";
import { db } from "@/lib/db";
import { StatusPill } from "@/components/StatusPill";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const visits = await db.visit.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { patient: true, nurse: true },
  });

  const grouped = visits.reduce<Record<string, typeof visits>>((acc, v) => {
    const day = v.scheduledAt.toDateString();
    (acc[day] ??= []).push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-navy">Schedule</h1>

      {Object.keys(grouped).length === 0 && (
        <p className="text-sm text-subtle">No visits scheduled. Schedule one from a patient's page.</p>
      )}

      {Object.entries(grouped).map(([day, dayVisits]: [string, typeof visits]) => (
        <div key={day}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-subtle">{day}</h2>
          <div className="card divide-y divide-black/5">
            {dayVisits.map((v) => (
              <Link
                key={v.id}
                href={`/patients/${v.patientId}`}
                className="flex items-center justify-between p-4 hover:bg-canvas"
              >
                <div className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-navy">
                    {v.scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div>
                    <div className="font-medium text-ink">
                      {v.patient.firstName} {v.patient.lastName}
                    </div>
                    <div className="text-xs text-subtle">
                      {v.serviceType} · {v.nurse?.name ?? "Unassigned"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-xs text-subtle">
                    {v.checkInAt && <div>In: {new Date(v.checkInAt).toLocaleTimeString()}</div>}
                    {v.checkOutAt && <div>Out: {new Date(v.checkOutAt).toLocaleTimeString()}</div>}
                  </div>
                  <StatusPill status={v.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}