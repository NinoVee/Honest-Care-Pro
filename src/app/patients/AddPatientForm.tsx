"use client";

import { useState } from "react";
import { createPatient } from "./actions";

interface Tablet {
  id: string;
  identifier: string;
}

interface ParsedFields {
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  medicalRecordNumber: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}

export function AddPatientForm({ availableTablets }: { availableTablets: Tablet[] }) {
  const [isDragging, setIsDragging] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    mrn: "",
    phone: "",
    email: "",
    addressLine: "",
    city: "",
    state: "",
    postalCode: "",
    allergies: "",
    tabletId: "",
  });

  function update(key: keyof typeof fields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function handleFile(file: File) {
    setImportError(null);
    const text = await file.text();
    const res = await fetch("/api/ccda/parse", { method: "POST", body: text });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setImportError(body.error ?? "Failed to parse this file.");
      return;
    }
    const parsed: ParsedFields = await res.json();
    setFields((f) => ({
      ...f,
      firstName: parsed.firstName ?? f.firstName,
      lastName: parsed.lastName ?? f.lastName,
      dateOfBirth: parsed.dateOfBirth ?? f.dateOfBirth,
      mrn: parsed.medicalRecordNumber ?? f.mrn,
      addressLine: parsed.addressLine ?? f.addressLine,
      city: parsed.city ?? f.city,
      state: parsed.state ?? f.state,
      postalCode: parsed.postalCode ?? f.postalCode,
    }));
    setImportedFileName(file.name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
    await createPatient(formData); // server action — redirects to the new patient's page on success
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-subtle">
          Import from Hospital Record (optional)
        </h2>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          className={`flex h-28 items-center justify-center rounded-card border-2 border-dashed text-center ${
            isDragging ? "border-teal bg-teal-light" : "border-black/15"
          }`}
        >
          <label className="cursor-pointer px-4 text-sm text-subtle">
            {importedFileName
              ? `Loaded "${importedFileName}" — fields below are pre-filled. Review before submitting.`
              : "Drag a C-CDA (.xml) file here, or click to browse"}
            <input
              type="file"
              accept=".xml"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </div>
        {importError && <p className="mt-2 text-sm text-alert-critical">{importError}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="firstName">First Name</label>
          <input className="field-input" id="firstName" required
            value={fields.firstName} onChange={(e) => update("firstName", e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="lastName">Last Name</label>
          <input className="field-input" id="lastName" required
            value={fields.lastName} onChange={(e) => update("lastName", e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="dateOfBirth">Date of Birth</label>
          <input className="field-input" id="dateOfBirth" type="date" required
            value={fields.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="mrn">Medical Record Number</label>
          <input className="field-input" id="mrn"
            value={fields.mrn} onChange={(e) => update("mrn", e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="phone">Phone</label>
          <input className="field-input" id="phone" type="tel"
            value={fields.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="email">Email</label>
          <input className="field-input" id="email" type="email"
            value={fields.email} onChange={(e) => update("email", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="addressLine">Address</label>
        <input className="field-input" id="addressLine" placeholder="123 Main St"
          value={fields.addressLine} onChange={(e) => update("addressLine", e.target.value)} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="field-label" htmlFor="city">City</label>
          <input className="field-input" id="city"
            value={fields.city} onChange={(e) => update("city", e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="state">State</label>
          <input className="field-input" id="state"
            value={fields.state} onChange={(e) => update("state", e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="postalCode">ZIP</label>
          <input className="field-input" id="postalCode"
            value={fields.postalCode} onChange={(e) => update("postalCode", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="allergies">Allergies (comma-separated)</label>
        <input className="field-input" id="allergies" placeholder="Penicillin, Latex"
          value={fields.allergies} onChange={(e) => update("allergies", e.target.value)} />
      </div>

      <div>
        <label className="field-label" htmlFor="tabletId">Kit # (Tablet Assignment)</label>
        <select className="field-input" id="tabletId"
          value={fields.tabletId} onChange={(e) => update("tabletId", e.target.value)}>
          <option value="">— Assign later —</option>
          {availableTablets.map((t) => (
            <option key={t.id} value={t.id}>{t.identifier}</option>
          ))}
        </select>
        {availableTablets.length === 0 && (
          <p className="mt-1 text-xs text-alert-urgent">All 20 kits are currently assigned or in maintenance.</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center">
        {isSubmitting ? "Creating…" : "Create Patient"}
      </button>
    </form>
  );
}