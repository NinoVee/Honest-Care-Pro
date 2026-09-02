import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { recordAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

/// Accepts a photo from the iOS app (multipart form-data), uploads it
/// to Vercel Blob storage, and records it against the patient so
/// physicians see it immediately on the web app.
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("photo") as File | null;
  const patientId = formData.get("patientId") as string | null;
  const visitId = (formData.get("visitId") as string | null) || null;
  const caption = (formData.get("caption") as string | null) || null;
  const uploadedBy = (formData.get("uploadedBy") as string | null) || null;

  if (!file || !patientId) {
    return NextResponse.json({ error: "photo and patientId are required" }, { status: 400 });
  }

  const blob = await put(`patients/${patientId}/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  const photo = await db.photo.create({
    data: { patientId, visitId, url: blob.url, caption, uploadedBy },
  });

  await recordAuditEvent({
    patientId,
    action: "photo.uploaded",
    resourceType: "Photo",
    resourceId: photo.id,
  });

  return NextResponse.json({ id: photo.id, url: photo.url });
}

export async function GET(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get("patientId");
  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }

  const photos = await db.photo.findMany({
    where: { patientId },
    orderBy: { takenAt: "desc" },
  });

  return NextResponse.json(photos);
}