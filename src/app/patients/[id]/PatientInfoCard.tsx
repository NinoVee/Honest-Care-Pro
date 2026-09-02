import { updatePatientInfo } from "../actions";

interface Props {
  patientId: string;
  allergies: string[];
  currentMedications: string[];
  notes: string | null;
}

export function PatientInfoCard({ patientId, allergies, currentMedications, notes }: Props) {
  return (
    <section className="card p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-subtle">
        Patient Information
      </h2>

      <div className="space-y-4">
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-subtle">Allergies</h3>
          {allergies.length === 0 ? (
            <p className="text-sm text-subtle">None recorded.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allergies.map((a) => (
                <span key={a} className="pill bg-alert-urgent/10 text-alert-urgent">⚠ {a}</span>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-subtle">Current Medications</h3>
          {currentMedications.length === 0 ? (
            <p className="text-sm text-subtle">None recorded.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentMedications.map((m) => (
                <span key={m} className="pill bg-alert-info/10 text-alert-info">{m}</span>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-subtle">Notes</h3>
          <p className="whitespace-pre-wrap text-sm text-ink">{notes || "No additional notes."}</p>
        </div>
      </div>

      <details className="mt-4 border-t border-black/5 pt-4">
        <summary className="cursor-pointer text-sm font-semibold text-teal">
          + Edit Patient Information
        </summary>
        <form action={updatePatientInfo.bind(null, patientId)} className="mt-4 space-y-3">
          <div>
            <label className="field-label" htmlFor="allergies">Allergies (comma-separated)</label>
            <input
              className="field-input"
              id="allergies"
              name="allergies"
              defaultValue={allergies.join(", ")}
              placeholder="Penicillin, Latex"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="currentMedications">Current Medications (comma-separated)</label>
            <input
              className="field-input"
              id="currentMedications"
              name="currentMedications"
              defaultValue={currentMedications.join(", ")}
              placeholder="Metformin 500mg, Lisinopril 10mg"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="notes">Notes</label>
            <textarea
              className="field-input"
              id="notes"
              name="notes"
              rows={3}
              defaultValue={notes ?? ""}
              placeholder="Additional information relevant to this patient's care..."
            />
          </div>
          <button type="submit" className="btn-primary w-full justify-center">
            Save Changes
          </button>
        </form>
      </details>
    </section>
  );
}