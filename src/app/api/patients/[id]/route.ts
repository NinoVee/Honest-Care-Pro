import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await db.patient.findUnique({ where: { id } });

  if (!patient || patient.deletedAt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: patient.id,
    displayName: `${patient.firstName} ${patient.lastName}`,
    dateOfBirth: patient.dateOfBirth.toISOString(),
    allergies: patient.allergies,
    precautions: patient.precautions,
    mrn: patient.medicalRecordNumber,
  });
}