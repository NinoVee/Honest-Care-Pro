import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/// Called by the iOS app whenever a nurse verifies and submits a reading.
/// Checks the patient's active treatment plan thresholds and creates an
/// Alert automatically if crossed — no silent alerts.
/// TODO: require real auth once login exists.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { patientId, visitId, kind, systolic, diastolic, value, unit } = body;

  if (!patientId || !kind || !unit) {
    return NextResponse.json({ error: "patientId, kind, and unit are required" }, { status: 400 });
  }

  const measurement = await db.measurement.create({
    data: { patientId, visitId: visitId || null, kind, systolic, diastolic, value, unit },
  });

  const activePlan = await db.treatmentPlan.findFirst({
    where: { patientId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  let createdAlert = null;
  if (activePlan && kind === "blood_pressure" && systolic != null) {
    if (activePlan.notifyIfSystolicOver && systolic >= activePlan.notifyIfSystolicOver) {
      createdAlert = await db.alert.create({
        data: {
          patientId, measurementId: measurement.id, severity: "CRITICAL",
          description: `Systolic BP ${systolic} is above the configured threshold (${activePlan.notifyIfSystolicOver}).`,
        },
      });
    } else if (activePlan.notifyIfSystolicUnder && systolic <= activePlan.notifyIfSystolicUnder) {
      createdAlert = await db.alert.create({
        data: {
          patientId, measurementId: measurement.id, severity: "URGENT",
          description: `Systolic BP ${systolic} is below the configured threshold (${activePlan.notifyIfSystolicUnder}).`,
        },
      });
    }
  }
  if (activePlan && kind === "spo2" && value != null && activePlan.notifyIfSpo2Under && value <= activePlan.notifyIfSpo2Under) {
    createdAlert = await db.alert.create({
      data: {
        patientId, measurementId: measurement.id, severity: "URGENT",
        description: `SpO2 ${value}% is below the configured threshold (${activePlan.notifyIfSpo2Under}%).`,
      },
    });
  }

  await db.auditLog.create({
    data: { patientId, action: "measurement.submitted", resourceType: "Measurement", resourceId: measurement.id },
  });

  return NextResponse.json({ measurement, alert: createdAlert });
}

/// Web app's "recent vitals" feed. ?patientId= filters to one patient.
export async function GET(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get("patientId");
  const measurements = await db.measurement.findMany({
    where: patientId ? { patientId } : undefined,
    include: { patient: true },
    orderBy: { measuredAt: "desc" },
    take: 100,
  });
  return NextResponse.json(measurements);
}