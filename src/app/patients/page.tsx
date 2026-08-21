import Link from "next/link";
import { db } from "@/lib/db";
import { createPatient } from "./actions";

export default async function PatientsPage() {
  const patients = await db.patient.findMany({
    where: { deletedAt: null },
    orderBy: { lastName: "asc" },
    include: { treatmentPlans: { where: { status: "ACTIVE" } } },
  });

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
            <label className="field-label" htmlFor="allergies">Allergies (comma-separated)</label>
            <input className="field-input" id="allergies" name="allergies" placeholder="Penicillin, Latex" />
          </div>
          <button type="submit" className="btn-primary w-full justify-center">
            Create Patient
          </button>
        </form>
      </div>
    </div>
  );
}
