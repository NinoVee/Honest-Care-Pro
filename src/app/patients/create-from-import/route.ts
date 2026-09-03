import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";
import { importVitalsFromCcda } from "@/lib/ccdaVitalsImport";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const org = await db.organization.findFirst();
  if (!org) return NextResponse.json({ error: "No organization found" }, { status: 500 });

  const dob = String(formData.get("dateOfBirth") ?? "");
  const patient = await db.patient.create({
    data: {
      organizationId: org.id,
      firstName: String(formData.get("firstName") ?? "Unknown"),
      lastName: String(formData.get("lastName") ?? "Unknown"),
      dateOfBirth: dob ? new Date(dob) : new Date("1900-01-01"),
      medicalRecordNumber: String(formData.get("mrn") ?? "") || null,
      addressLine: String(formData.get("addressLine") ?? "") || null,
      city: String(formData.get("city") ?? "") || null,
      state: String(formData.get("state") ?? "") || null,
      postalCode: String(formData.get("postalCode") ?? "") || null,
    },
  });

  await recordAuditEvent({
    action: "patient.imported_from_ccda",
    resourceType: "Patient",
    resourceId: patient.id,
    patientId: patient.id,
  });

  await importVitalsFromCcda(patient.id, formData.get("vitalsJson"));

  return NextResponse.redirect(new URL(`/patients/${patient.id}`, req.url));
}