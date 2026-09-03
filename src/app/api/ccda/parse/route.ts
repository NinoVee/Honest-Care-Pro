import { NextRequest, NextResponse } from "next/server";
import { parseCcda, CcdaParseError } from "@/lib/ccda";

export const dynamic = "force-dynamic";

/// Parses the standard C-CDA/CCD patient-demographics and Vital Signs
/// sections (ClinicalDocument > recordTarget > patientRole, and the Vital
/// Signs section under structuredBody). Real-world documents vary by EHR
/// vendor — this covers the standard structure, not every vendor's quirks.
/// Returns extracted fields for physician review before anything is
/// written to the database (see the import-review UI).
export async function POST(req: NextRequest) {
  const xml = await req.text();
  if (!xml.trim()) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }

  try {
    return NextResponse.json(parseCcda(xml));
  } catch (err) {
    if (err instanceof CcdaParseError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json({ error: "Failed to parse XML. Confirm this is a valid C-CDA document." }, { status: 422 });
  }
}
