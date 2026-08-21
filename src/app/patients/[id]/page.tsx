import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { createTreatmentPlan, signTreatmentPlan, scheduleVisit } from "../actions";
import { StatusPill } from "@/components/StatusPill";

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const patient = await db.patient.findUnique({
    where: { id: params.id },
    include: {
      treatmentPlans: { orderBy: { createdAt: "desc" } },
      visits: { orderBy: { scheduledAt: "desc" }, include: { nurse: true } },
    },
  });

  if (!patient) notFound();

  const nurses = await db.user.findMany({ where: { role: "NURSE" } });
  const activePlans = patient.treatmentPlans.filter((p) => p.status === "ACTIVE");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-navy">
          {patient.firstName} {patient.lastName}
        </h1>
        <p className="text-sm text-subtle">
          DOB {patient.dateOfBirth.toLocaleDateString()} · MRN {patient.medicalRecordNumber ?? "—"}
        </p>
      </div>

      {(patient.allergies.length > 0 || patient.precautions.length > 0) && (
        <div className="card border-l-4 border-l-alert-urgent p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-alert-urgent">
            Clinical Alerts
          </h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {patient.allergies.map((a) => (
              <span key={a} className="pill bg-alert-urgent/10 text-alert-urgent">⚠ {a}</span>
            ))}
            {patient.precautions.map((p) => (
              <span key={p} className="pill bg-alert-info/10 text-alert-info">{p}</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Treatment Plans */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-navy">Treatment Plans</h2>

          <div className="space-y-3">
            {patient.treatmentPlans.length === 0 && (
              <p className="text-sm text-subtle">No treatment plans yet.</p>
            )}
            {patient.treatmentPlans.map((plan) => (
              <div key={plan.id} className="card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-medium text-ink">{plan.treatmentType}</div>
                  <PlanStatusPill status={plan.status} />
                </div>
                <p className="text-sm text-subtle">{plan.diagnosis}</p>
                <p className="mt-1 text-sm text-ink">{plan.description}</p>
                <p className="mt-1 text-xs text-subtle">
                  Frequency: {plan.frequency} · Starts {plan.startDate.toLocaleDateString()}
                </p>
                {plan.signedAt ? (
                  <p className="mt-2 text-xs text-alert-good">
                    ✓ Signed by {plan.signedBy} on {plan.signedAt.toLocaleString()}
                  </p>
                ) : (
                  <form action={signTreatmentPlan.bind(null, plan.id, patient.id)} className="mt-3">
                    <button type="submit" className="btn-secondary text-xs">
                      Sign &amp; Activate Plan
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>

          <details className="card p-4">
            <summary className="cursor-pointer text-sm font-semibold text-teal">
              + New Treatment Plan
            </summary>
            <form action={createTreatmentPlan.bind(null, patient.id)} className="mt-4 space-y-3">
              <div>
                <label className="field-label" htmlFor="diagnosis">Diagnosis</label>
                <input className="field-input" id="diagnosis" name="diagnosis" required />
              </div>
              <div>
                <label className="field-label" htmlFor="treatmentType">Treatment Type</label>
                <input className="field-input" id="treatmentType" name="treatmentType" required placeholder="Wound care" />
              </div>
              <div>
                <label className="field-label" htmlFor="description">Description</label>
                <textarea className="field-input" id="description" name="description" rows={2} required />
              </div>
              <div>
                <label className="field-label" htmlFor="instructions">Instructions</label>
                <textarea className="field-input" id="instructions" name="instructions" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="frequency">Frequency</label>
                  <input className="field-input" id="frequency" name="frequency" placeholder="3x/week" required />
                </div>
                <div>
                  <label className="field-label" htmlFor="startDate">Start Date</label>
                  <input className="field-input" id="startDate" name="startDate" type="date" required />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="requiredVitals">Required Vitals (comma-separated)</label>
                <input className="field-input" id="requiredVitals" name="requiredVitals" placeholder="blood_pressure, spo2" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="field-label" htmlFor="notifyIfSystolicOver">Notify if Systolic &gt;</label>
                  <input className="field-input" id="notifyIfSystolicOver" name="notifyIfSystolicOver" type="number" />
                </div>
                <div>
                  <label className="field-label" htmlFor="notifyIfSystolicUnder">Notify if Systolic &lt;</label>
                  <input className="field-input" id="notifyIfSystolicUnder" name="notifyIfSystolicUnder" type="number" />
                </div>
                <div>
                  <label className="field-label" htmlFor="notifyIfSpo2Under">Notify if SpO2 &lt;</label>
                  <input className="field-input" id="notifyIfSpo2Under" name="notifyIfSpo2Under" type="number" />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full justify-center">
                Save as Draft
              </button>
            </form>
          </details>
        </section>

        {/* Visits */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-navy">Visits</h2>

          <div className="space-y-3">
            {patient.visits.length === 0 && (
              <p className="text-sm text-subtle">No visits scheduled yet.</p>
            )}
            {patient.visits.map((v) => (
              <div key={v.id} className="card flex items-center justify-between p-4">
                <div>
                  <div className="font-medium text-ink">{v.serviceType}</div>
                  <div className="text-xs text-subtle">
                    {v.scheduledAt.toLocaleString()} · {v.nurse?.name ?? "Unassigned"}
                  </div>
                </div>
                <StatusPill status={v.status} />
              </div>
            ))}
          </div>

          <details className="card p-4">
            <summary className="cursor-pointer text-sm font-semibold text-teal">
              + Schedule Visit
            </summary>
            <form action={scheduleVisit.bind(null, patient.id)} className="mt-4 space-y-3">
              <div>
                <label className="field-label" htmlFor="serviceType">Service</label>
                <input className="field-input" id="serviceType" name="serviceType" required placeholder="Blood Draw" />
              </div>
              <div>
                <label className="field-label" htmlFor="treatmentPlanId">Treatment Plan</label>
                <select className="field-input" id="treatmentPlanId" name="treatmentPlanId">
                  <option value="">— None —</option>
                  {activePlans.map((p) => (
                    <option key={p.id} value={p.id}>{p.treatmentType}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="nurseId">Assign Nurse</label>
                <select className="field-input" id="nurseId" name="nurseId">
                  <option value="">— Unassigned —</option>
                  {nurses.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label" htmlFor="scheduledAt">Date &amp; Time</label>
                  <input className="field-input" id="scheduledAt" name="scheduledAt" type="datetime-local" required />
                </div>
                <div>
                  <label className="field-label" htmlFor="durationMin">Duration (min)</label>
                  <input className="field-input" id="durationMin" name="durationMin" type="number" defaultValue={45} />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="instructions">Visit Instructions</label>
                <textarea className="field-input" id="instructions" name="instructions" rows={2} />
              </div>
              <button type="submit" className="btn-primary w-full justify-center">
                Schedule Visit
              </button>
            </form>
          </details>
        </section>
      </div>
    </div>
  );
}

function PlanStatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-black/5 text-subtle",
    PENDING_SIGNATURE: "bg-alert-urgent/10 text-alert-urgent",
    ACTIVE: "bg-alert-good/10 text-alert-good",
    ON_HOLD: "bg-alert-info/10 text-alert-info",
    COMPLETED: "bg-black/5 text-subtle",
    DISCONTINUED: "bg-alert-critical/10 text-alert-critical",
  };
  return <span className={`pill ${styles[status] ?? ""}`}>{status.replace("_", " ")}</span>;
}