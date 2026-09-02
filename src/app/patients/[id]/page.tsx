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