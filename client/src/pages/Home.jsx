import { Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { useChecklist, useEntries, useCustomItems } from '../lib/queries';
import { buildEntryMap, buildCustomMap, getAreaProgress, getTotals } from '../lib/checklist';
import { canEditArea } from '../lib/permissions';
import { useAuth } from '../context/AuthContext';
import { pctClasses } from '../lib/statusStyles';
import { AreaIcon } from '../components/areaIcons';
import { PageHeader, Skeleton } from '../components/ui';

export default function Home() {
  const { user } = useAuth();
  const { data: cl, isLoading: l1, error: e1 } = useChecklist();
  const { data: entries, isLoading: l2, error: e2 } = useEntries();
  const { data: customItems } = useCustomItems();

  if (l1 || l2) return <LoadingGrid />;
  if (e1 || e2) return <ErrorBox error={e1 || e2} />;

  const checklist = cl.checklist;
  const map = buildEntryMap(entries);
  const customMap = buildCustomMap(customItems);
  const areas = Object.keys(checklist);
  const totals = getTotals(checklist, map, customMap);

  return (
    <div>
      <PageHeader title="Inspection Areas" subtitle="Select an area to verify its handover checklist.">
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-2 shadow-card">
          <div className="text-right">
            <div className="text-lg font-semibold leading-none text-maroon tnum">{totals.pct}%</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-stone-400">Complete</div>
          </div>
          <div className="h-9 w-px bg-stone-200" />
          <div className="text-right">
            <div className="text-lg font-semibold leading-none text-ink tnum">
              {totals.done}
              <span className="text-sm font-normal text-stone-400">/{totals.total}</span>
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-stone-400">Items</div>
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area) => {
          const p = getAreaProgress(checklist, area, map, customMap);
          const locked = !canEditArea(user, area);
          return (
            <Link
              key={area}
              to={`/area/${encodeURIComponent(area)}`}
              className="card group p-5 transition duration-200 hover:-translate-y-0.5 hover:border-maroon/20 hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-maroon-light text-maroon ring-1 ring-inset ring-maroon/10">
                  <AreaIcon area={area} className="h-5 w-5" />
                </div>
                <span className={`badge ${pctClasses(p.pct)}`}>{p.pct}%</span>
              </div>

              <div className="mt-4 flex items-center gap-1.5">
                <span className="text-[15px] font-semibold text-ink">{area}</span>
                {locked && (
                  <Lock
                    className="h-3.5 w-3.5 text-stone-400"
                    aria-label="Read-only — not assigned to you"
                  />
                )}
              </div>
              <div className="mt-0.5 text-xs text-stone-500 tnum">
                {p.done}/{p.total} items complete
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-maroon transition-all duration-500"
                  style={{ width: `${p.pct}%` }}
                />
              </div>

              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-maroon opacity-0 transition group-hover:opacity-100">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div>
      <Skeleton className="mb-6 h-9 w-56" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="card p-5">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="mt-4 h-4 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/3" />
            <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorBox({ error }) {
  const msg = error?.response?.data?.error || error?.message || 'Failed to load data';
  return (
    <div className="rounded-xl border border-maroon/20 bg-maroon-light px-4 py-3 text-sm text-maroon">
      {msg}
    </div>
  );
}
