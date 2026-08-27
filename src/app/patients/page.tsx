import Link from "next/link";
import { db } from "@/lib/db";
import { createPatient } from "./actions";

export const dynamic = "force-dynamic";

export default async function PatientsPage() {
  const [patients, availableTablets] = await Promise.all([
    db.patient.findMany({
      where: { deletedAt: null },
      orderBy: { lastName: "asc" },
      include: { treatmentPlans: { where: { status: "ACTIVE" } }, assignedTablet: true },
    }),
    db.tablet.findMany({ where: { status: "AVAILABLE" }, orderBy: { identifier: "asc" } }),
  ]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="mb-4 text-2xl font-semibold text-navy">Patients</h1>
        <div className="card divide-y divide-black/5">
          {patients.length === 0 && (
            <p className="p-6 text-sm text-subtle">No patients yet — add one to get started.</p>
          )}
          {patients.map((p) => (
            <Link
              key={p.id}
              href={`/patients/${p.id}`}
              className="flex items-center justify-between p-4 hover:bg-canvas"
            >
              <div>
                <div className="font-medium text-ink">
                  {p.firstName} {p.lastName}
                </div>
                <div className="text-xs text-subtle">
                  DOB {p.dateOfBirth.toLocaleDateString()} · MRN {p.medicalRecordNumber ?? "—"}
                  {p.assignedTablet && <> · Kit {p.assignedTablet.identifier}</>}
                </div>
              </div>
              <span className="pill bg-teal-light text-teal">
                {p.treatmentPlans.length} active plan{p.treatmentPlans.length === 1 ? "" : "s"}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="card h-fit p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtle">
          Add Patient
        </h2>
        <form action={createPatient} className="space-y-3">
          <div>
            <label className="field-label" htmlFor="firstName">First Name</label>
            <input className="field-input" id="firstName" name="firstName" required />
          </div>
          <div>
            <label className="field-label" htmlFor="lastName">Last Name</label>
            <input className="field-input" id="lastName" name="lastName" required />
          </div>
          <div>
            <label className="field-label" htmlFor="dateOfBirth">Date of Birth</label>
            <input className="field-input" id="dateOfBirth" name="dateOfBirth" type="date" required />
          </div>
          <div>
            <label className="field-label" htmlFor="mrn">Medical Record Number</label>
            <input className="field-input" id="mrn" name="mrn" />
          </div>
          <div>
            <label className="field-label" htmlFor="phone">Phone</label>
            <input className="field-input" id="phone" name="phone" type="tel" />
          </div>
          <div>
            <label className="field-label" htmlFor="email">Email</label>
            <input className="field-input" id="email" name="email" type="email" />
          </div>
          <div>
            <label className="field-label" htmlFor="addressLine">Address</label>
            <input className="field-input" id="addressLine" name="addressLine" placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="field-label" htmlFor="city">City</label>
              <input className="field-input" id="city" name="city" />
            </div>
            <div>
              <label className="field-label" htmlFor="state">State</label>
              <input className="field-input" id="state" name="state" />
            </div>
            <div>
              <label className="field-label" htmlFor="postalCode">ZIP</label>
              <input className="field-input" id="postalCode" name="postalCode" />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="allergies">Allergies (comma-separated)</label>
            <input className="field-input" id="allergies" name="allergies" placeholder="Penicillin, Latex" />
          </div>

          <div>
            <label className="field-label" htmlFor="tabletId">Kit # (Tablet Assignment)</label>
            <select className="field-input" id="tabletId" name="tabletId">
              <option value="">— Assign later —</option>
              {availableTablets.map((t) => (
                <option key={t.id} value={t.id}>{t.identifier}</option>
              ))}
            </select>
            {availableTablets.length === 0 && (
              <p className="mt-1 text-xs text-alert-urgent">All 20 kits are currently assigned or in maintenance.</p>
            )}
          </div>

          <button type="submit" className="btn-primary w-full justify-center">
            Create Patient
          </button>
        </form>
      </div>
    </div>
  );
}