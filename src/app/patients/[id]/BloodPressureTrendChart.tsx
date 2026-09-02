"use client";

interface Point {
  measuredAt: string;
  systolic: number;
  diastolic: number;
}

interface Props {
  points: Point[];
}

export function BloodPressureTrendChart({ points }: Props) {
  if (points.length === 0) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-semibold text-navy">Blood Pressure Trend</h3>
        <p className="text-sm text-subtle">No blood pressure readings yet.</p>
      </div>
    );
  }

  const width = 600;
  const height = 160;
  const padding = 24;

  const allValues = points.flatMap((p) => [p.systolic, p.diastolic]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue || 1;

  const xFor = (i: number) =>
    padding + (i / Math.max(points.length - 1, 1)) * (width - padding * 2);
  const yFor = (value: number) =>
    height - padding - ((value - minValue) / range) * (height - padding * 2);

  const systolicPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.systolic)}`)
    .join(" ");
  const diastolicPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.diastolic)}`)
    .join(" ");

  const latest = points[points.length - 1];

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-navy">Blood Pressure Trend</h3>
        <span className="text-xs text-subtle">
          Latest: {latest.systolic}/{latest.diastolic} mmHg
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <path d={systolicPath} fill="none" stroke="#E0475A" strokeWidth={2} />
        <path d={diastolicPath} fill="none" stroke="#7C9CB8" strokeWidth={2} />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={xFor(i)} cy={yFor(p.systolic)} r={3} fill="#E0475A" />
            <circle cx={xFor(i)} cy={yFor(p.diastolic)} r={3} fill="#7C9CB8" />
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-between text-xs text-subtle">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#E0475A" }} />
            Systolic
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#7C9CB8" }} />
            Diastolic
          </span>
        </div>
        <span>{new Date(points[0].measuredAt).toLocaleDateString()} – {new Date(latest.measuredAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}