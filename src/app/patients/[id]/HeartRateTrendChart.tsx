"use client";

interface Point {
  measuredAt: string; // ISO date string
  value: number;
}

/// Plain SVG line chart — no charting library needed. Points are
/// expected oldest-first for a left-to-right trend line.
export function HeartRateTrendChart({ points }: { points: Point[] }) {
  if (points.length === 0) {
    return (
      <p className="text-sm text-subtle">
        No heart rate readings yet. Values captured from the nurse's iPad will appear here.
      </p>
    );
  }

  const width = 640;
  const height = 180;
  const padding = 32;

  const values = points.map((p) => p.value);
  const minVal = Math.min(...values, 60) - 10;
  const maxVal = Math.max(...values, 100) + 10;

  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  function xFor(i: number) {
    return padding + i * xStep;
  }
  function yFor(v: number) {
    return height - padding - ((v - minVal) / (maxVal - minVal)) * (height - padding * 2);
  }

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.value)}`)
    .join(" ");

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="min-w-full">
        {/* gridlines */}
        {[minVal, (minVal + maxVal) / 2, maxVal].map((gridVal) => (
          <g key={gridVal}>
            <line
              x1={padding} x2={width - padding}
              y1={yFor(gridVal)} y2={yFor(gridVal)}
              stroke="#00000010"
            />
            <text x={4} y={yFor(gridVal) + 4} fontSize="10" fill="#5C6B6F">
              {Math.round(gridVal)}
            </text>
          </g>
        ))}

        <path d={pathD} fill="none" stroke="#14B1A2" strokeWidth={2} />

        {points.map((p, i) => (
          <circle key={i} cx={xFor(i)} cy={yFor(p.value)} r={3.5} fill="#14B1A2" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-subtle">
        <span>{new Date(points[0].measuredAt).toLocaleDateString()}</span>
        <span>{new Date(points[points.length - 1].measuredAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}