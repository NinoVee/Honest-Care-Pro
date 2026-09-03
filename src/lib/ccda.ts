import { XMLParser } from "fast-xml-parser";

/// Thrown when the document doesn't even look like a C-CDA (no
/// recordTarget/patientRole). Distinguished from other parse failures so
/// the API route can surface a more specific error message.
export class CcdaParseError extends Error {}

export interface ParsedVital {
  kind: string;
  value?: number;
  unit: string;
  systolic?: number;
  diastolic?: number;
  measuredAt: string;
}

export interface ParsedCcdaPatient {
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  medicalRecordNumber: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  vitals: ParsedVital[];
}

function asArray<T>(x: T | T[] | undefined | null): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

/// C-CDA effectiveTime values are HL7 timestamps (YYYYMMDD[hhmmss][+-ZZZZ]).
/// Timezone offsets are ignored for simplicity — precise enough for
/// ordering readings and displaying a date on the patient profile.
function parseHl7Timestamp(raw?: string): Date | null {
  if (!raw) return null;
  const m = raw.match(/^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/);
  if (!m) return null;
  const [, y, mo = "01", d = "01", h = "00", mi = "00", s = "00"] = m;
  const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/// LOINC codes for the vitals the Vital Signs section commonly carries.
/// "blood_pressure_systolic"/"diastolic" are combined into one
/// "blood_pressure" measurement below rather than stored as their own kind.
const VITAL_CODE_KIND: Record<string, string> = {
  "8480-6": "blood_pressure_systolic",
  "8462-4": "blood_pressure_diastolic",
  "8867-4": "heart_rate",
  "9279-1": "respiratory_rate",
  "8310-5": "temperature",
  "8302-2": "height",
  "29463-7": "weight",
  "3141-9": "weight",
  "2708-6": "spo2",
  "59408-5": "spo2",
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/// Normalizes vendor unit variations (kg vs lb, Cel vs degF, cm vs in) to
/// the units this app already displays on trend charts, so a value from
/// any EHR reads correctly next to readings taken by the iOS app.
function normalizeUnit(kind: string, rawValue: number, rawUnit: string | undefined): { value: number; unit: string } {
  const u = (rawUnit ?? "").toLowerCase();
  switch (kind) {
    case "temperature":
      if (u === "cel" || u === "c") return { value: round1((rawValue * 9) / 5 + 32), unit: "°F" };
      return { value: rawValue, unit: "°F" };
    case "weight":
      if (u === "kg") return { value: round1(rawValue * 2.20462), unit: "lb" };
      return { value: rawValue, unit: "lb" };
    case "height":
      if (u === "cm") return { value: round1(rawValue / 2.54), unit: "in" };
      return { value: rawValue, unit: "in" };
    case "heart_rate":
    case "respiratory_rate":
      return { value: rawValue, unit: "bpm" };
    case "spo2":
      return { value: rawValue, unit: "%" };
    default:
      return { value: rawValue, unit: rawUnit ?? "" };
  }
}

interface RawObservation {
  code: string;
  value: number;
  unit: string | undefined;
  effectiveTime: Date;
}

/// Finds the CCD Vital Signs section (LOINC 8716-3 / template
/// 2.16.840.1.113883.10.20.22.2.4) within ClinicalDocument/component/structuredBody.
function findVitalSignsSection(doc: any): any | null {
  const components = asArray(doc?.ClinicalDocument?.component?.structuredBody?.component);
  for (const comp of components) {
    const section = comp?.section;
    if (!section) continue;
    const code = asArray(section.code)[0] ?? section.code;
    if (code?.["@_code"] === "8716-3") return section;
    const templateIds = asArray(section.templateId);
    if (templateIds.some((t: any) => t?.["@_root"] === "2.16.840.1.113883.10.20.22.2.4")) return section;
  }
  return null;
}

function extractObservations(section: any): RawObservation[] {
  const results: RawObservation[] = [];
  for (const entry of asArray(section.entry)) {
    const organizer = entry?.organizer;
    if (!organizer) continue;
    const organizerTime = parseHl7Timestamp(organizer.effectiveTime?.["@_value"]);
    for (const oc of asArray(organizer.component)) {
      const obs = oc?.observation;
      if (!obs) continue;
      const code = (asArray(obs.code)[0] ?? obs.code)?.["@_code"];
      if (!code || !(code in VITAL_CODE_KIND)) continue;
      const valueNode = asArray(obs.value)[0] ?? obs.value;
      const rawValue = valueNode?.["@_value"];
      const numericValue = rawValue != null ? parseFloat(rawValue) : NaN;
      const effectiveTime = parseHl7Timestamp(obs.effectiveTime?.["@_value"]) ?? organizerTime;
      if (Number.isNaN(numericValue) || !effectiveTime) continue;
      results.push({ code, value: numericValue, unit: valueNode?.["@_unit"], effectiveTime });
    }
  }
  return results;
}

/// Keeps only the most recent reading of each vital — i.e. the observations
/// sharing the latest effectiveTime found in the section — since the goal
/// is populating "current vitals" on the patient profile, not full history.
function buildMostRecentVitals(observations: RawObservation[]): ParsedVital[] {
  if (observations.length === 0) return [];
  const maxTime = Math.max(...observations.map((o) => o.effectiveTime.getTime()));
  const latest = observations.filter((o) => o.effectiveTime.getTime() === maxTime);
  const measuredAt = new Date(maxTime).toISOString();

  const vitals: ParsedVital[] = [];
  let systolic: number | null = null;
  let diastolic: number | null = null;

  for (const obs of latest) {
    const kind = VITAL_CODE_KIND[obs.code];
    if (kind === "blood_pressure_systolic") {
      systolic = Math.round(obs.value);
      continue;
    }
    if (kind === "blood_pressure_diastolic") {
      diastolic = Math.round(obs.value);
      continue;
    }
    const { value, unit } = normalizeUnit(kind, obs.value, obs.unit);
    vitals.push({ kind, value, unit, measuredAt });
  }

  if (systolic != null && diastolic != null) {
    vitals.push({ kind: "blood_pressure", systolic, diastolic, unit: "mmHg", measuredAt });
  }

  return vitals;
}

/// Parses the standard C-CDA/CCD patient-demographics and Vital Signs
/// sections. Real-world documents vary by EHR vendor — this covers the
/// standard structure, not every vendor's quirks.
export function parseCcda(xml: string): ParsedCcdaPatient {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(xml);

  const patientRole = doc?.ClinicalDocument?.recordTarget?.patientRole;
  if (!patientRole) {
    throw new CcdaParseError("Could not find recordTarget/patientRole — not a recognized C-CDA document");
  }

  const name = asArray(patientRole.patient?.name)[0];
  const given = asArray(name?.given)[0];
  const family = name?.family;

  const birthTimeRaw: string | undefined = patientRole.patient?.birthTime?.["@_value"];
  const dateOfBirth = birthTimeRaw
    ? `${birthTimeRaw.slice(0, 4)}-${birthTimeRaw.slice(4, 6)}-${birthTimeRaw.slice(6, 8)}`
    : null;

  const id = asArray(patientRole.id)[0];
  const mrn = id?.["@_extension"] ?? null;

  const addr = asArray(patientRole.addr)[0];

  const vitalSection = findVitalSignsSection(doc);
  const vitals = vitalSection ? buildMostRecentVitals(extractObservations(vitalSection)) : [];

  return {
    firstName: given ?? null,
    lastName: family ?? null,
    dateOfBirth,
    medicalRecordNumber: mrn,
    addressLine: addr?.streetAddressLine ?? null,
    city: addr?.city ?? null,
    state: addr?.state ?? null,
    postalCode: addr?.postalCode ?? null,
    vitals,
  };
}
