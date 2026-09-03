import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const visit = await db.visit.update({
    where: { id },
    data: { checkOutAt: new Date(), status: "COMPLETED" },
  });

  await db.auditLog.create({
    data: {
      patientId: visit.patientId,
      action: "visit.checked_out",
      resourceType: "Visit",
      resourceId: visit.id,
    },
  });

  return NextResponse.json({ checkOutAt: visit.checkOutAt });
}