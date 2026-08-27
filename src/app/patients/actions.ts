"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

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
  const tabletId = String(formData.get("tabletId") ?? "") || null;

  if (!firstName || !lastName || !dobRaw) {
    throw new Error("First name, last name, and date of birth are required.");
  }

  if (tabletId) {
    const tablet = await db.tablet.findUnique({ where: { id: tabletId } });
    if (!tablet || tablet.status !== "AVAILABLE") {
      throw new Error("That kit is no longer available. Please choose a different one.");
    }
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
      addressLine: String(formData.get("addressLine") ?? "") || null,
      city: String(formData.get("city") ?? "") || null,
      state: String(formData.get("state") ?? "") || null,
      postalCode: String(formData.get("postalCode") ?? "") || null,
      allergies: String(formData.get("allergies") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      assignedTabletId: tabletId,
    },
  });

  if (tabletId) {
    await db.tablet.update({ where: { id: tabletId }, data: { status: "ASSIGNED" } });
    await recordAuditEvent({
      patientId: patient.id,
      action: "tablet.assigned",
      resourceType: "Tablet",
      resourceId: tabletId,
    });
  }

  await recordAuditEvent({
    action: "patient.created",
    resourceType: "Patient",
    resourceId: patient.id,
    patientId: patient.id,
  });

  revalidatePath("/patients");
  revalidatePath("/tablets");
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

export async function signTreatmentPlan(planId: string, patientId: string) {
  const physician = await getCurrentPhysician();

  const plan = await db.treatmentPlan.update({
    where: { id: planId },
    data: { status: "ACTIVE", signedAt: new Date(), signedBy: physician.name },
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

export async function assignTablet(patientId: string) {
  const tablet = await db.tablet.findFirst({ where: { status: "AVAILABLE" } });
  if (!tablet) {
    throw new Error("No tablets available — all 20 are currently assigned or in maintenance.");
  }

  await db.$transaction([
    db.tablet.update({ where: { id: tablet.id }, data: { status: "ASSIGNED" } }),
    db.patient.update({ where: { id: patientId }, data: { assignedTabletId: tablet.id } }),
  ]);

  await recordAuditEvent({
    patientId,
    action: "tablet.assigned",
    resourceType: "Tablet",
    resourceId: tablet.id,
  });

  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/tablets");
}

export async function unassignTablet(tabletId: string) {
  const tablet = await db.tablet.findUnique({
    where: { id: tabletId },
    include: { currentPatient: true },
  });
  if (!tablet || !tablet.currentPatient) {
    throw new Error("This tablet isn't currently assigned to a patient.");
  }

  await db.$transaction([
    db.patient.update({ where: { id: tablet.currentPatient.id }, data: { assignedTabletId: null } }),
    db.tablet.update({ where: { id: tabletId }, data: { status: "AVAILABLE" } }),
  ]);

  await recordAuditEvent({
    patientId: tablet.currentPatient.id,
    action: "tablet.unassigned",
    resourceType: "Tablet",
    resourceId: tabletId,
  });

  revalidatePath("/tablets");
  revalidatePath(`/patients/${tablet.currentPatient.id}`);
}

export async function dischargePatient(patientId: string) {
  const patient = await db.patient.findUniqueOrThrow({ where: { id: patientId } });

  const ops: Prisma.PrismaPromise<unknown>[] = [
    db.patient.update({
      where: { id: patientId },
      data: { status: "DISCHARGED", dischargedAt: new Date(), assignedTabletId: null },
    }),
  ];
  if (patient.assignedTabletId) {
    ops.push(db.tablet.update({ where: { id: patient.assignedTabletId }, data: { status: "AVAILABLE" } }));
  }
  await db.$transaction(ops);

  await recordAuditEvent({
    patientId,
    action: "patient.discharged",
    resourceType: "Patient",
    resourceId: patientId,
  });

  revalidatePath(`/patients/${patientId}`);
  revalidatePath("/tablets");
  revalidatePath("/patients");
}

/// Soft-removes a patient from the active program. Nothing is deleted —
/// `deletedAt` is set, which already excludes them from the /patients
/// list query. Their tablet (if any) is freed. All records (visits,
/// treatment plans, vitals, audit history) remain queryable in the
/// database indefinitely.
export async function removePatientFromProgram(patientId: string) {
  const patient = await db.patient.findUniqueOrThrow({ where: { id: patientId } });

  const ops: Prisma.PrismaPromise<unknown>[] = [
    db.patient.update({
      where: { id: patientId },
      data: {
        status: "DISCHARGED",
        dischargedAt: new Date(),
        deletedAt: new Date(),
        assignedTabletId: null,
      },
    }),
  ];
  if (patient.assignedTabletId) {
    ops.push(db.tablet.update({ where: { id: patient.assignedTabletId }, data: { status: "AVAILABLE" } }));
  }
  await db.$transaction(ops);

  await recordAuditEvent({
    patientId,
    action: "patient.removed_from_program",
    resourceType: "Patient",
    resourceId: patientId,
  });

  revalidatePath("/patients");
  revalidatePath("/tablets");
  redirect("/patients");
}

export async function acknowledgeAlert(alertId: string, patientId: string) {
  await db.alert.update({
    where: { id: alertId },
    data: { acknowledgedAt: new Date(), acknowledgedBy: "Dr. Test Physician" },
  });

  await recordAuditEvent({
    patientId,
    action: "alert.acknowledged",
    resourceType: "Alert",
    resourceId: alertId,
  });

  revalidatePath("/vitals");
  revalidatePath(`/patients/${patientId}`);
}

function numberOrNull(value: FormDataEntryValue | null): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}