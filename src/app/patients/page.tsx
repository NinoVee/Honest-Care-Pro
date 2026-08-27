import Link from "next/link";
import { db } from "@/lib/db";
import { AddPatientForm } from "./AddPatientForm";

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
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_480px]">
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

      <div className="card h-fit p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-subtle">
          Add Patient
        </h2>
        <AddPatientForm availableTablets={availableTablets} />
      </div>
    </div>
  );
}