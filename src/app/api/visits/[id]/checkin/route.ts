import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const visit = await db.visit.update({
    where: { id: params.id },
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