import { getRoomProgress } from '../lib/checklist';

export default function RoomGrid({ checklist, area, selected, onSelect, entriesMap, customMap }) {
  const floors = checklist[area].floors;

  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          Select Room
        </span>
        <div className="flex items-center gap-3 text-[10px] text-stone-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Complete
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> In progress
          </span>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-2">
        {floors.map((f) => {
          const p = getRoomProgress(checklist, area, f.num, entriesMap, customMap);
          const isSel = selected === f.num;
          let tone = 'border-stone-200 bg-white text-stone-600 hover:border-maroon/40 hover:text-ink';
          if (p.pct === 100) tone = 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300';
          else if (p.pct > 0) tone = 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300';
          if (isSel) tone = 'border-maroon bg-maroon text-white shadow-sm';
          return (
            <button
              key={f.num}
              onClick={() => onSelect(f.num)}
              title={`${f.cat} · ${p.pct}% complete`}
              className={`rounded-lg border px-1 py-2 text-center text-xs font-semibold tnum transition active:scale-95 ${tone}`}
            >
              {f.num}
              {f.cat !== 'Standard' && (
                <span className="ml-0.5 align-super text-[8px]">
                  {f.cat.includes('Club') ? '◆' : '★'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
