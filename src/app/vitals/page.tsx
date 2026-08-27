import { db } from "@/lib/db";
import { acknowledgeAlert } from "@/app/patients/actions";

export const dynamic = "force-dynamic";

export default async function VitalsPage() {
  const [alerts, measurements] = await Promise.all([
    db.alert.findMany({ where: { acknowledgedAt: null }, include: { patient: true }, orderBy: { createdAt: "desc" } }),
    db.measurement.findMany({ include: { patient: true }, orderBy: { measuredAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-navy">Live Vitals &amp; Alerts</h1>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-alert-urgent">
          Unacknowledged Alerts ({alerts.length})
        </h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-subtle">No active alerts.</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className="card flex items-center justify-between border-l-4 border-l-alert-urgent p-4">
                <div>
                  <div className="font-medium text-ink">{a.patient.firstName} {a.patient.lastName}</div>
                  <div className="text-sm text-subtle">{a.description}</div>
                  <div className="text-xs text-subtle">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
                <form action={acknowledgeAlert.bind(null, a.id, a.patientId)}>
                  <button type="submit" className="btn-secondary text-xs">Acknowledge</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-subtle">Recent Vitals</h2>
        <div className="card divide-y divide-black/5">
          {measurements.length === 0 && <p className="p-4 text-sm text-subtle">No vitals submitted yet.</p>}
          {measurements.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-ink">{m.patient.firstName} {m.patient.lastName}</div>
                <div className="text-sm text-subtle">
                  {m.kind.replace("_", " ")}: {m.kind === "blood_pressure" ? `${m.systolic}/${m.diastolic}` : m.value} {m.unit}
                </div>
              </div>
              <div className="text-xs text-subtle">{new Date(m.measuredAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}