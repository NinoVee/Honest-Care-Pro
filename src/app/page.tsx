import Link from "next/link";
import { db } from "@/lib/db";
import { StatusPill } from "@/components/StatusPill";

export default async function DashboardPage() {
  const [todaysVisits, unsignedPlans, recentAudit, patientCount] = await Promise.all([
    db.visit.findMany({
      where: {
        scheduledAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      include: { patient: true, nurse: true },
      orderBy: { scheduledAt: "asc" },
    }),
    db.treatmentPlan.findMany({
      where: { status: "PENDING_SIGNATURE" },
      include: { patient: true },
    }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.patient.count({ where: { deletedAt: null } }),,
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Dashboard</h1>
        <p className="text-sm text-subtle">{patientCount} patients in this organization.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <DashboardCard title="Today's Visits" count={todaysVisits.length}>
          {todaysVisits.length === 0 ? (
            <EmptyRow text="No visits scheduled today." />
          ) : (
            todaysVisits.map((v) => (
              <div key={v.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium text-ink">
                    {v.patient.firstName} {v.patient.lastName}
                  </div>
                  <div className="text-subtle">{v.serviceType} — {v.nurse?.name ?? "Unassigned"}</div>
                </div>
                <StatusPill status={v.status} />
              </div>
            ))
          )}
        </DashboardCard>

        <DashboardCard title="Unsigned Treatment Plans" count={unsignedPlans.length}>
          {unsignedPlans.length === 0 ? (
            <EmptyRow text="Nothing pending signature." />
          ) : (
            unsignedPlans.map((p) => (
              <Link
                key={p.id}
                href={`/patients/${p.patientId}`}
                className="block py-2 text-sm hover:text-teal"
              >
                <div className="font-medium">{p.patient.firstName} {p.patient.lastName}</div>
                <div className="text-subtle">{p.treatmentType}</div>
              </Link>
            ))
          )}
        </DashboardCard>

        <DashboardCard title="Recent Activity" count={recentAudit.length}>
          {recentAudit.length === 0 ? (
            <EmptyRow text="No activity yet." />
          ) : (
            recentAudit.map((a) => (
              <div key={a.id} className="py-2 text-sm">
                <div className="font-medium text-ink">{a.action}</div>
                <div className="text-xs text-subtle">
                  {a.resourceType} · {new Date(a.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </DashboardCard>
      </div>

      <Link href="/patients" className="btn-primary">
        View All Patients
      </Link>
    </div>
  );
}

function DashboardCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-subtle">{title}</h2>
        <span className="pill bg-teal-light text-teal">{count}</span>
      </div>
      <div className="divide-y divide-black/5">{children}</div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="py-2 text-sm text-subtle">{text}</p>;
}