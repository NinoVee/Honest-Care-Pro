import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  createTreatmentPlan,
  signTreatmentPlan,
  scheduleVisit,
  acknowledgeAlert,
  assignTablet,
  removePatientFromProgram,
  checkInVisit,
  checkOutVisit,
} from "../actions";
import { StatusPill } from "@/components/StatusPill";
import { HeartRateTrendChart } from "./HeartRateTrendChart";
import { BloodPressureTrendChart } from "./BloodPressureTrendChart";
import { VitalTrendChart } from "./VitalTrendChart";
import { ConfirmRemovePatientButton } from "./ConfirmRemovePatientButton";
import { CallPatientButtons } from "./CallPatientButtons";
import { PhotoGallery } from "./PhotoGallery";
import { PatientInfoCard } from "./PatientInfoCard";

export const dynamic = "force-dynamic";

export default async function PatientDetailPage({ params }: { params: { id: string } }) {
  const patient = await db.patient.findUnique({
    where: { id: params.id },
    include: {
      treatmentPlans: { orderBy: { createdAt: "desc" } },
      visits: { orderBy: { scheduledAt: "desc" }, include: { nurse: true } },
      assignedTablet: true,
    },
  });

  if (!patient) notFound();

  const [nurses, vitals, patientAlerts] = await Promise.all([
    db.user.findMany({ where: { role: "NURSE" } }),
    db.measurement.findMany({
      where: { patientId: patient.id },
      orderBy: { measuredAt: "desc" },
      take: 50,
    }),
    db.alert.findMany({
      where: { patientId: patient.id, acknowledgedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const heartRatePoints = vitals
    .filter((v) => v.kind === "heart_rate" && v.value != null)
    .sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime())
    .map((v) => ({ measuredAt: v.measuredAt.toISOString(), value: v.value as number }));

  const bloodPressurePoints = vitals
    .filter((v) => v.kind === "blood_pressure" && v.systolic != null && v.diastolic != null)
    .sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime())
    .map((v) => ({
      measuredAt: v.measuredAt.toISOString(),
      systolic: v.systolic as number,
      diastolic: v.diastolic as number,
    }));

  const spo2Points = vitals
    .filter((v) => v.kind === "spo2" && v.value != null)
    .sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime())
    .map((v) => ({ measuredAt: v.measuredAt.toISOString(), value: v.value as number }));

  const weightPoints = vitals
    .filter((v) => v.kind === "weight" && v.value != null)
    .sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime())
    .map((v) => ({ measuredAt: v.measuredAt.toISOString(), value: v.value as number }));

  const temperaturePoints = vitals
    .filter((v) => v.kind === "temperature" && v.value != null)
    .sort((a, b) => a.measuredAt.getTime() - b.measuredAt.getTime())
    .map((v) => ({ measuredAt: v.measuredAt.toISOString(), value: v.value as number }));

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

      <section className="card p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-subtle">
          Assigned Device
        </h2>
        {patient.assignedTablet ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-medium text-ink">{patient.assignedTablet.identifier}</div>
              <div className="text-xs text-subtle">Home monitoring kit — status: {patient.assignedTablet.status}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-subtle">No kit currently assigned to this patient.</p>
            <form action={assignTablet.bind(null, patient.id)}>
              <button type="submit" className="btn-secondary text-xs">Assign Next Available Kit</button>
            </form>
          </div>
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-subtle">
          Call Patient
        </h2>
        <CallPatientButtons
          patientId={patient.id}
          patientName={`${patient.firstName} ${patient.lastName}`}
          phone={patient.phone}
        />
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-subtle">
          Photos
        </h2>
        <PhotoGallery patientId={patient.id} />
      </section>

      <PatientInfoCard
        patientId={patient.id}
        allergies={patient.allergies}
        currentMedications={patient.currentMedications}
        notes={patient.notes}
      />

      {patientAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-alert-urgent">
            Unacknowledged Vital Alerts ({patientAlerts.length})
          </h2>
          {patientAlerts.map((a) => (
            <div key={a.id} className="card flex items-center justify-between border-l-4 border-l-alert-urgent p-4">
              <div>
                <div className="text-sm text-ink">{a.description}</div>
                <div className="text-xs text-subtle">{new Date(a.createdAt).toLocaleString()}</div>
              </div>
              <form action={acknowledgeAlert.bind(null, a.id, patient.id)}>
                <button type="submit" className="btn-secondary text-xs">Acknowledge</button>
              </form>
            </div>
          ))}
        </div>
      )}

      <section className="card p-4 space-y-6">
        <h2 className="text-lg font-semibold text-navy">Vital Trends</h2>
        <div>
          <HeartRateTrendChart points={heartRatePoints} />
        </div>
        <div className="border-t border-black/5 pt-6">
          <BloodPressureTrendChart points={bloodPressurePoints} />
        </div>
        <div className="border-t border-black/5 pt-6">
          <VitalTrendChart title="SpO2 Trend" unit="%" color="#14B1A2" points={spo2Points} />
        </div>
        <div className="border-t border-black/5 pt-6">
          <VitalTrendChart title="Weight Trend" unit="lb" color="#0B1F3A" points={weightPoints} />
        </div>
        <div className="border-t border-black/5 pt-6">
          <VitalTrendChart title="Temperature Trend" unit="°F" color="#E07856" points={temperaturePoints} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-navy">Recent Vitals</h2>
        <div className="card divide-y divide-black/5">
          {vitals.length === 0 ? (
            <p className="p-4 text-sm text-subtle">
              No vitals submitted yet. Readings taken from the nurse's iPad during a visit will appear here.
            </p>
          ) : (
            vitals.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-4">
                <div className="text-sm font-medium text-ink">
                  {v.kind.replace("_", " ")}: {v.kind === "blood_pressure" ? `${v.systolic}/${v.diastolic}` : v.value} {v.unit}
                </div>
                <div className="text-xs text-subtle">{new Date(v.measuredAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
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

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-navy">Visits</h2>

          <div className="space-y-3">
            {patient.visits.length === 0 && (
              <p className="text-sm text-subtle">No visits scheduled yet.</p>
            )}
            {patient.visits.map((v) => (
              <div key={v.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-ink">{v.serviceType}</div>
                    <div className="text-xs text-subtle">
                      {v.scheduledAt.toLocaleString()} · {v.nurse?.name ?? "Unassigned"}
                    </div>
                  </div>
                  <StatusPill status={v.status} />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                  <div className="text-xs text-subtle">
                    {v.checkInAt ? (
                      <div>✓ Checked in: {new Date(v.checkInAt).toLocaleString()}</div>
                    ) : (
                      <div>Not checked in</div>
                    )}
                    {v.checkOutAt && <div>✓ Checked out: {new Date(v.checkOutAt).toLocaleString()}</div>}
                  </div>
                  <div className="flex gap-2">
                    {!v.checkInAt && (
                      <form action={checkInVisit.bind(null, v.id, patient.id)}>
                        <button type="submit" className="btn-secondary text-xs">Check In</button>
                      </form>
                    )}
                    {v.checkInAt && !v.checkOutAt && (
                      <form action={checkOutVisit.bind(null, v.id, patient.id)}>
                        <button type="submit" className="btn-secondary text-xs">Check Out</button>
                      </form>
                    )}
                  </div>
                </div>
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

      <section className="card border-l-4 border-l-alert-critical p-4">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-alert-critical">
          Danger Zone
        </h2>
        <p className="mb-3 text-sm text-subtle">
          Removing a patient clears them from the active app views. Their full record stays in the database permanently.
        </p>
        <ConfirmRemovePatientButton
          patientId={patient.id}
          patientName={`${patient.firstName} ${patient.lastName}`}
          action={removePatientFromProgram}
        />
      </section>
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