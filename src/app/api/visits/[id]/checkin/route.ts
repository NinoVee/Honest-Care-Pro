import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visit = await db.visit.update({
    where: { id },
    data: { checkInAt: new Date(), status: "ARRIVED" },
  });

  await db.auditLog.create({
    data: {
      patientId: visit.patientId,
      action: "visit.checked_in",
      resourceType: "Visit",
      resourceId: visit.id,
    },
  });

  return NextResponse.json({ checkInAt: visit.checkInAt });
}