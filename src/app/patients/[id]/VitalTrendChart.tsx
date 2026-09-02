"use client";

interface Point {
  measuredAt: string;
  value: number;
}

interface Props {
  title: string;
  unit: string;
  color: string;
  points: Point[];
}

export function VitalTrendChart({ title, unit, color, points }: Props) {
  if (points.length === 0) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-semibold text-navy">{title}</h3>
        <p className="text-sm text-subtle">No {title.toLowerCase()} readings yet.</p>
      </div>
    );
  }

  const width = 600;
  const height = 160;
  const padding = 24;

  const values = points.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const coords = points.map((p, i) => {
    const x = padding + (i / Math.max(points.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((p.value - minValue) / range) * (height - padding * 2);
    return { x, y, value: p.value, measuredAt: p.measuredAt };
  });

  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-navy">{title}</h3>
        <span className="text-xs text-subtle">
          Latest: {values[values.length - 1]} {unit}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <path d={pathD} fill="none" stroke={color} strokeWidth={2} />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={3} fill={color} />
        ))}
      </svg>
      <div className="flex justify-between text-xs text-subtle">
        <span>{new Date(points[0].measuredAt).toLocaleDateString()}</span>
        <span>{new Date(points[points.length - 1].measuredAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}