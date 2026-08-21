import { db } from "./db";

/// Every patient/plan/visit mutation in this app should call this.
/// Audit writes must never block or fail the primary operation — errors
/// are logged, not thrown, so a logging hiccup can't stop a physician
/// from saving a treatment plan.
export async function recordAuditEvent(input: {
  userId?: string;
  patientId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
}) {
  try {
    await db.auditLog.create({ data: input });
  } catch (err) {
    console.error("Failed to write audit event", err);
  }
}
