import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

export const dynamic = "force-dynamic";

/// Parses the standard C-CDA/CCD patient-demographics section
/// (ClinicalDocument > recordTarget > patientRole). Real-world documents
/// vary by EHR vendor — this covers the standard structure, not every
/// vendor's quirks. Returns extracted fields for physician review before
/// anything is written to the database (see the import-review UI).
export async function POST(req: NextRequest) {
  const xml = await req.text();
  if (!xml.trim()) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }

  try {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
    const doc = parser.parse(xml);

    const patientRole = doc?.ClinicalDocument?.recordTarget?.patientRole;
    if (!patientRole) {
      return NextResponse.json({ error: "Could not find recordTarget/patientRole — not a recognized C-CDA document" }, { status: 422 });
    }

    const name = Array.isArray(patientRole.patient?.name) ? patientRole.patient.name[0] : patientRole.patient?.name;
    const given = Array.isArray(name?.given) ? name.given[0] : name?.given;
    const family = name?.family;

    const birthTimeRaw: string | undefined = patientRole.patient?.birthTime?.["@_value"];
    const dateOfBirth = birthTimeRaw
      ? `${birthTimeRaw.slice(0, 4)}-${birthTimeRaw.slice(4, 6)}-${birthTimeRaw.slice(6, 8)}`
      : null;

    const id = Array.isArray(patientRole.id) ? patientRole.id[0] : patientRole.id;
    const mrn = id?.["@_extension"] ?? null;

    const addr = Array.isArray(patientRole.addr) ? patientRole.addr[0] : patientRole.addr;

    return NextResponse.json({
      firstName: given ?? null,
      lastName: family ?? null,
      dateOfBirth,
      medicalRecordNumber: mrn,
      addressLine: addr?.streetAddressLine ?? null,
      city: addr?.city ?? null,
      state: addr?.state ?? null,
      postalCode: addr?.postalCode ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to parse XML. Confirm this is a valid C-CDA document." }, { status: 422 });
  }
}