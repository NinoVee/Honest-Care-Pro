import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/// Read-only itinerary feed for the iOS app. Optionally filter by nurseId
/// so a nurse only sees visits assigned to them.
/// TODO: require a real auth token once login exists — this is unauthenticated.
export async function GET(req: NextRequest) {
  const nurseId = req.nextUrl.searchParams.get("nurseId");

  const visits = await db.visit.findMany({
    where: nurseId ? { nurseId } : undefined,
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