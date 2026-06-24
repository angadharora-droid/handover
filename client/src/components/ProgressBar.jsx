export default function ProgressBar({ pct, color = '#6f0e13' }) {
  return (
    <div className="h-[7px] w-full overflow-hidden rounded-full bg-stone-200">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}
