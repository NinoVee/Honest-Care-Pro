"use client";

import { useState } from "react";

interface ParsedPatient {
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  medicalRecordNumber: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}

export default function ImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [parsed, setParsed] = useState<ParsedPatient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setParsed(null);
    const text = await file.text();
    const res = await fetch("/api/ccda/parse", { method: "POST", body: text });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to parse file.");
      return;
    }
    setParsed(await res.json());
  }

  async function createFromParsed() {
    if (!parsed) return;
    setIsCreating(true);
    const form = new FormData();
    form.set("firstName", parsed.firstName ?? "");
    form.set("lastName", parsed.lastName ?? "");
    form.set("dateOfBirth", parsed.dateOfBirth ?? "");
    form.set("mrn", parsed.medicalRecordNumber ?? "");
    form.set("addressLine", parsed.addressLine ?? "");
    form.set("city", parsed.city ?? "");
    form.set("state", parsed.state ?? "");
    form.set("postalCode", parsed.postalCode ?? "");
    const res = await fetch("/api/patients/create-from-import", { method: "POST", body: form });
    setIsCreating(false);
    if (res.redirected) window.location.href = res.url;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy">Import C-CDA Document</h1>
      <p className="text-sm text-subtle">
        Drag a C-CDA (.xml) document from the hospital EHR here. This extracts patient
        demographics for review — nothing is saved until you confirm below.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={`flex h-40 items-center justify-center rounded-card border-2 border-dashed ${
          isDragging ? "border-teal bg-teal-light" : "border-black/15"
        }`}
      >
        <label className="cursor-pointer text-sm text-subtle">
          Drop a .xml file here, or click to browse
          <input
            type="file"
            accept=".xml"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </label>
      </div>

      {error && <p className="text-sm text-alert-critical">{error}</p>}

      {parsed && (
        <div className="card space-y-3 p-5">
          <h2 className="font-semibold text-navy">Review Extracted Information</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-subtle">First Name:</span> {parsed.firstName ?? "—"}</div>
            <div><span className="text-subtle">Last Name:</span> {parsed.lastName ?? "—"}</div>
            <div><span className="text-subtle">Date of Birth:</span> {parsed.dateOfBirth ?? "—"}</div>
            <div><span className="text-subtle">MRN:</span> {parsed.medicalRecordNumber ?? "—"}</div>
            <div><span className="text-subtle">Address:</span> {parsed.addressLine ?? "—"}</div>
            <div><span className="text-subtle">City/State/ZIP:</span> {[parsed.city, parsed.state, parsed.postalCode].filter(Boolean).join(", ") || "—"}</div>
          </div>
          <button onClick={createFromParsed} disabled={isCreating} className="btn-primary">
            {isCreating ? "Creating…" : "Create Patient From This Import"}
          </button>
        </div>
      )}
    </div>
  );
}