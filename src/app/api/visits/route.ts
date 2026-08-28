import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/// Read-only itinerary feed for the iOS app. The web app is the source
/// of truth — a patient removed via removePatientFromProgram() sets
/// deletedAt, and this filter ensures their visits stop appearing on
/// any nurse's iPad the next time it syncs, without needing to touch
/// the iOS app's own data model.
export async function GET(req: NextRequest) {
  const nurseId = req.nextUrl.searchParams.get("nurseId");

  const visits = await db.visit.findMany({
    where: {
      ...(nurseId ? { nurseId } : {}),
      patient: { deletedAt: null },
    },
    include: { patient: true, nurse: true, treatmentPlan: true },
    orderBy: { scheduledAt: "asc" },
  });

  const payload = visits.map((v) => ({
    id: v.id,
    patientId: v.patientId,
    patientDisplayName: `${v.patient.firstName} ${v.patient.lastName}`,
    visitType: v.serviceType,
    status: v.status,
    scheduledAt: v.scheduledAt.toISOString(),
    durationMin: v.durationMin,
    assignedNurse: v.nurse?.name ?? "Unassigned",
    treatmentSummary: v.treatmentPlan?.treatmentType ?? v.instructions ?? "No treatment plan linked",
    instructions: v.instructions,
  }));

  return NextResponse.json(payload);
}