"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

// TODO: replace with the real authenticated user once auth exists.
// Every action below should use the actor's real id, not this stub.
async function getCurrentPhysician() {
  const user = await db.user.findFirst({ where: { role: "PHYSICIAN" } });
  if (!user) throw new Error("No physician user found — did you run the seed script?");
  return user;
}

export async function createPatient(formData: FormData) {
  const org = await db.organization.findFirst();
  if (!org) throw new Error("No organization found — did you run the seed script?");

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const dobRaw = String(formData.get("dateOfBirth") ?? "");

  if (!firstName || !lastName || !dobRaw) {
    throw new Error("First name, last name, and date of birth are required.");
  }

  const patient = await db.patient.create({
    data: {
      organizationId: org.id,
      firstName,
      lastName,
      dateOfBirth: new Date(dobRaw),
      medicalRecordNumber: String(formData.get("mrn") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      allergies: String(formData.get("allergies") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    },
  });

  await recordAuditEvent({
    action: "patient.created",
    resourceType: "Patient",
    resourceId: patient.id,
    patientId: patient.id,
  });

  revalidatePath("/patients");
  redirect(`/patients/${patient.id}`);
}

export async function createTreatmentPlan(patientId: string, formData: FormData) {
  const physician = await getCurrentPhysician();

  const plan = await db.treatmentPlan.create({
    data: {
      patientId,
      physicianId: physician.id,
      diagnosis: String(formData.get("diagnosis") ?? ""),
      treatmentType: String(formData.get("treatmentType") ?? ""),
      description: String(formData.get("description") ?? ""),
      instructions: String(formData.get("instructions") ?? "") || null,
      frequency: String(formData.get("frequency") ?? ""),
      startDate: new Date(String(formData.get("startDate") ?? new Date().toISOString())),
      requiredVitals: String(formData.get("requiredVitals") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      notifyIfSystolicOver: numberOrNull(formData.get("notifyIfSystolicOver")),
      notifyIfSystolicUnder: numberOrNull(formData.get("notifyIfSystolicUnder")),
      notifyIfSpo2Under: numberOrNull(formData.get("notifyIfSpo2Under")),
      status: "DRAFT",
    },
  });

  await recordAuditEvent({
    userId: physician.id,
    patientId,
    action: "treatment_plan.created",
    resourceType: "TreatmentPlan",
    resourceId: plan.id,
  });

  revalidatePath(`/patients/${patientId}`);
}

/// Signing locks the plan. Any subsequent edit must go through
/// `reviseTreatmentPlan`, which creates a new version instead of
/// mutating this row — see the schema comment on TreatmentPlan.
export async function signTreatmentPlan(planId: string, patientId: string) {
  const physician = await getCurrentPhysician();

  const plan = await db.treatmentPlan.update({
    where: { id: planId },
    data: {
      status: "ACTIVE",
      signedAt: new Date(),
      signedBy: physician.name,
    },
  });

  await recordAuditEvent({
    userId: physician.id,
    patientId,
    action: "treatment_plan.signed",
    resourceType: "TreatmentPlan",
    resourceId: plan.id,
  });

  revalidatePath(`/patients/${patientId}`);
}

export async function scheduleVisit(patientId: string, formData: FormData) {
  const nurseId = String(formData.get("nurseId") ?? "") || null;
  const treatmentPlanId = String(formData.get("treatmentPlanId") ?? "") || null;

  const visit = await db.visit.create({
    data: {
      patientId,
      nurseId,
      treatmentPlanId,
      serviceType: String(formData.get("serviceType") ?? ""),
      scheduledAt: new Date(String(formData.get("scheduledAt") ?? "")),
      durationMin: Number(formData.get("durationMin") ?? 45),
      instructions: String(formData.get("instructions") ?? "") || null,
      status: nurseId ? "SCHEDULED" : "UNASSIGNED",
    },
  });

  await recordAuditEvent({
    patientId,
    action: "visit.scheduled",
    resourceType: "Visit",
    resourceId: visit.id,
  });

  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/schedule");
}

function numberOrNull(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
