import { db } from "./db";
import { recordAuditEvent } from "./audit";
import type { ParsedVital } from "./ccda";

const ALLOWED_KINDS = new Set([
  "heart_rate",
  "blood_pressure",
  "spo2",
  "weight",
  "temperature",
  "height",
  "respiratory_rate",
]);

/// vitalsJson round-trips through the browser (parsed on the server, sent
/// to the client for review, then posted back on submit), so it's
/// re-validated here rather than trusted as-is.
function sanitizeVital(v: unknown): ParsedVital | null {
  if (!v || typeof v !== "object") return null;
  const candidate = v as Record<string, unknown>;
  if (typeof candidate.kind !== "string" || !ALLOWED_KINDS.has(candidate.kind)) return null;
  if (typeof candidate.unit !== "string" || !candidate.unit) return null;
  if (typeof candidate.measuredAt !== "string") return null;
  const measuredAt = new Date(candidate.measuredAt);
  if (Number.isNaN(measuredAt.getTime())) return null;

  if (candidate.kind === "blood_pressure") {
    if (typeof candidate.systolic !== "number" || typeof candidate.diastolic !== "number") return null;
    return { kind: candidate.kind, systolic: candidate.systolic, diastolic: candidate.diastolic, unit: candidate.unit, measuredAt: measuredAt.toISOString() };
  }
  if (typeof candidate.value !== "number" || !Number.isFinite(candidate.value)) return null;
  return { kind: candidate.kind, value: candidate.value, unit: candidate.unit, measuredAt: measuredAt.toISOString() };
}

/// Populates a newly-enrolled patient's profile with the most recent
/// vital signs pulled from their C-CDA import. vitalsJson is the
/// JSON-serialized ParsedVital[] carried through the review form as a
/// hidden field (see AddPatientForm / import/page.tsx).
export async function importVitalsFromCcda(patientId: string, vitalsJson: FormDataEntryValue | null) {
  if (!vitalsJson || typeof vitalsJson !== "string") return;

  let raw: unknown;
  try {
    raw = JSON.parse(vitalsJson);
  } catch {
    return;
  }
  if (!Array.isArray(raw)) return;

  const vitals = raw.map(sanitizeVital).filter((v): v is ParsedVital => v != null);
  if (vitals.length === 0) return;

  await db.measurement.createMany({
    data: vitals.map((v) => ({
      patientId,
      kind: v.kind,
      value: v.value ?? null,
      systolic: v.systolic ?? null,
      diastolic: v.diastolic ?? null,
      unit: v.unit,
      measuredAt: new Date(v.measuredAt),
      source: "ccda_import",
    })),
  });

  await recordAuditEvent({
    patientId,
    action: "patient.vitals_imported_from_ccda",
    resourceType: "Patient",
    resourceId: patientId,
  });
}
