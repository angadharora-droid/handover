import { useState } from 'react';
import { Gauge, CheckCircle2, AlertTriangle, Clock, MapPin, CircleDashed, ChevronDown } from 'lucide-react';
import { useChecklist, useEntries, useCustomItems } from '../lib/queries';
import {
  buildEntryMap,
  buildCustomMap,
  buildNameLookup,
  groupEntriesByStatus,
  getAllStatusCounts,
  getAreaProgress,
  getTotals,
} from '../lib/checklist';
import { PIE_COLORS, STATUS_COLOR, STATUS_LABEL } from '../lib/statusStyles';
import DonutChart from '../components/DonutChart';
import ProgressBar from '../components/ProgressBar';
import { PageHeader, LoadingScreen } from '../components/ui';
import { formatDateTime } from '../lib/format';
import { ErrorBox } from './Home';

// The items sitting in one status, grouped by area, shown when a status row on
// the "By Status" tab is expanded.
function StatusItemList({ records }) {
  if (!records.length) {
    return (
      <div className="mt-2 rounded-lg border border-dashed border-stone-200 px-3 py-4 text-center text-xs text-stone-400">
        No items in this status yet.
      </div>
    );
  }

  const byArea = {};
  records.forEach((r) => {
    (byArea[r.area] ||= []).push(r);
  });
  Object.values(byArea).forEach((list) =>
    list.sort(
      (a, b) =>
        String(a.room || '').localeCompare(String(b.room || ''), undefined, { numeric: true }) ||
        String(a.itemId).localeCompare(String(b.itemId), undefined, { numeric: true })
    )
  );

  return (
    <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50/60">
      {Object.keys(byArea)
        .sort((a, b) => a.localeCompare(b))
        .map((area) => (
          <div key={area} className="border-t border-stone-200 first:border-t-0">
            <div className="flex items-center gap-2 px-3 pb-1 pt-2.5 text-[11px] font-semibold text-maroon">
              {area}
              <span className="badge bg-stone-200 text-stone-600">{byArea[area].length}</span>
            </div>
            <div className="divide-y divide-stone-200/70 px-3">
              {byArea[area].map((rec) => (
                <div key={`${rec.area}::${rec.room || ''}::${rec.itemId}`} className="py-1.5">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 text-xs">
                    <span className="font-medium text-ink">{rec.item}</span>
                    {rec.room && <span className="text-[11px] text-stone-500">· Room {rec.room}</span>}
                  </div>
                  {rec.remarks && (
                    <div className="mt-0.5 text-[11px] italic text-stone-500">“{rec.remarks}”</div>
                  )}
                  {rec.updatedAt && (
                    <div className="mt-0.5 text-[10px] text-stone-400">
                      {[rec.updatedByName, formatDateTime(rec.updatedAt)].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color, tint }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: tint, color }}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tnum" style={{ color }}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-medium text-stone-500">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { data: cl, isLoading: l1, error: e1 } = useChecklist();
  const { data: entries, isLoading: l2, error: e2 } = useEntries();
  const { data: customItems } = useCustomItems();
  const [tab, setTab] = useState('area');
  // Which status row on the "By Status" tab is expanded (null = none).
  const [openStatus, setOpenStatus] = useState(null);

  if (l1 || l2) return <LoadingScreen />;
  if (e1 || e2) return <ErrorBox error={e1 || e2} />;

  const checklist = cl.checklist;
  const map = buildEntryMap(entries);
  const customMap = buildCustomMap(customItems);
  const counts = getAllStatusCounts(checklist, map, customMap);
  const totals = getTotals(checklist, map, customMap);
  const entriesByStatus = groupEntriesByStatus(entries, buildNameLookup(checklist, customItems));
  const statusKeys = cl.statusOptions.map((o) => o.val).filter(Boolean);

  const donutData = [...statusKeys, ''].map((k) => ({
    key: k || 'none',
    label: STATUS_LABEL[k],
    value: counts[k] || 0,
    color: PIE_COLORS[k],
  }));

  const metrics = [
    { icon: Gauge, label: 'Completed', value: `${totals.pct}%`, color: '#6f0e13', tint: '#fcefee' },
    { icon: CheckCircle2, label: 'Accepted', value: counts['accepted'] || 0, color: '#27500a', tint: '#eaf3de' },
    { icon: AlertTriangle, label: 'Damaged', value: counts['damaged'] || 0, color: '#791f1f', tint: '#fcebeb' },
    { icon: Clock, label: 'Pending Install', value: counts['pending-install'] || 0, color: '#633806', tint: '#faeeda' },
    { icon: MapPin, label: 'Next Visit', value: counts['next-visit'] || 0, color: '#72243e', tint: '#fbeaf0' },
    { icon: CircleDashed, label: 'Not started', value: counts[''] || 0, color: '#6b6a64', tint: '#f1efe8' },
  ];

  const tabs = [
    ['area', 'By Area'],
    ['status', 'By Status'],
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Hariganga → Centre Point Hospitality · Amravati"
      />

      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {metrics.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Status distribution */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 text-sm font-semibold text-ink">Status Distribution</div>
          <div className="flex flex-col items-center gap-5">
            <DonutChart data={donutData} size={170} />
            <div className="grid w-full grid-cols-1 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-1">
              {donutData.map((d) => {
                if (!d.value && d.key !== 'none') return null;
                return (
                  <div key={d.key} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-stone-600">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                      {d.label}
                    </span>
                    <span className="font-semibold text-ink tnum">{d.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Breakdown tabs */}
        <div className="card p-5 lg:col-span-3">
          <div className="mb-4 inline-flex rounded-lg border border-stone-200 bg-stone-100 p-0.5">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
                  tab === key ? 'bg-white text-ink shadow-sm' : 'text-stone-500 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'area' && (
            <div className="space-y-3.5">
              {Object.keys(checklist).map((area) => {
                const p = getAreaProgress(checklist, area, map, customMap);
                const acc = p.counts['accepted'] || 0;
                const cph = p.counts['cph'] || 0;
                const dmg = p.counts['damaged'] || 0;
                const pend = (p.counts['pending-install'] || 0) + (p.counts['docs-pending'] || 0);
                const nv = p.counts['next-visit'] || 0;
                const started = Object.values(p.counts).reduce((a, b) => a + b, 0);
                const notStarted = p.total - started;
                return (
                  <div key={area}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-ink">{area}</span>
                      <span className="shrink-0 text-sm font-semibold text-maroon tnum">{p.pct}%</span>
                    </div>
                    <ProgressBar pct={p.pct} />
                    <div className="mt-1 text-[11px] text-stone-500 tnum">
                      {acc} accepted · {cph} CPH · {dmg} damaged · {pend} pending · {nv} next visit · {notStarted} not started
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'status' && (
            <div className="space-y-3.5">
              <p className="text-[11px] text-stone-500">Tap a status to see the items in it.</p>
              {cl.statusOptions
                .filter((o) => o.val)
                .map((o) => {
                  const cnt = counts[o.val] || 0;
                  const pct = totals.total ? Math.round((cnt / totals.total) * 100) : 0;
                  const open = openStatus === o.val;
                  return (
                    <div key={o.val}>
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpenStatus(open ? null : o.val)}
                        className="w-full rounded-lg px-1 py-0.5 text-left transition hover:bg-stone-50"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                            <ChevronDown
                              className={`h-3.5 w-3.5 shrink-0 text-stone-400 transition-transform ${
                                open ? 'rotate-0' : '-rotate-90'
                              }`}
                            />
                            {o.label}
                          </span>
                          <span className="text-sm font-semibold tnum" style={{ color: STATUS_COLOR[o.val] }}>
                            {cnt}
                          </span>
                        </div>
                        <ProgressBar pct={pct} color={STATUS_COLOR[o.val]} />
                      </button>
                      {open && <StatusItemList records={entriesByStatus[o.val] || []} />}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
