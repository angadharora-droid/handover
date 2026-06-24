// Lightweight SVG donut, mirroring the prototype's canvas chart.
// `data` is [{ key, label, value, color }].

function arcPath(cx, cy, r, start, end) {
  const large = end - start > Math.PI ? 1 : 0;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export default function DonutChart({ data, size = 150 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const hole = r * 0.46;
  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((a, d) => a + d.value, 0);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {total === 0 && <circle cx={cx} cy={cy} r={r} fill="#d3d1c7" />}

      {total > 0 && slices.length === 1 && (
        <circle cx={cx} cy={cy} r={r} fill={slices[0].color} />
      )}

      {total > 0 &&
        slices.length > 1 &&
        (() => {
          let start = -Math.PI / 2;
          return slices.map((d) => {
            const angle = (d.value / total) * Math.PI * 2;
            const path = arcPath(cx, cy, r, start, start + angle);
            start += angle;
            return <path key={d.key} d={path} fill={d.color} stroke="white" strokeWidth="2" />;
          });
        })()}

      {/* center hole */}
      <circle cx={cx} cy={cy} r={hole} fill="white" />
      <text x={cx} y={cy - 3} textAnchor="middle" className="fill-ink" fontSize="15" fontWeight="700">
        {total}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#5f5e5a" fontSize="9">
        items
      </text>
    </svg>
  );
}
