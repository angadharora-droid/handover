import { useEffect, useState } from 'react';
import { AlertTriangle, Info, Check, ClipboardList, Download } from 'lucide-react';
import {
  useChecklist,
  useEntries,
  useFinalSignoff,
  useFinalise,
  useHandover,
  useCustomItems,
  useUsers,
} from '../lib/queries';
import { getItems, isImmediateAction } from '../lib/checklist';
import { STATUS_LABEL, STATUS_SECTION, STATUS_COLOR } from '../lib/statusStyles';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../lib/format';
import { downloadSignoffReport } from '../lib/signoffReport';
import { apiError } from '../lib/api';
import { PageHeader, LoadingScreen, EmptyState } from '../components/ui';
import { ErrorBox } from './Home';

// Accepted / dropped items are not Hariganga's outstanding scope.
const HGA_SCOPE = new Set(['pending-install', 'docs-pending', 'damaged', 'phase2', 'next-visit']);

function collect(checklist, entries, keywords, customItems) {
  const nameLookup = {};
  Object.keys(checklist).forEach((area) => {
    getItems(checklist, area).forEach((it) => {
      nameLookup[`${area}::${it.id}`] = it.name;
    });
  });
  (customItems || []).forEach((c) => {
    nameLookup[`${c.area}::${c.id}`] = c.name;
  });

  const byStatus = {};
  const immediate = [];
  (entries || []).forEach((e) => {
    if (!e.status) return;
    const rec = { ...e, item: nameLookup[`${e.area}::${e.itemId}`] || e.itemId };
    (byStatus[e.status] ||= []).push(rec);
    if (e.remarks && isImmediateAction(e.remarks, keywords)) immediate.push(rec);
  });
  return { byStatus, immediate };
}

// Build a name lookup keyed by `area::itemId` from the template + custom items,
// so every entry can be shown with its real item name (not the bare id code).
function buildNameLookup(checklist, customItems) {
  const lookup = {};
  Object.keys(checklist).forEach((area) => {
    getItems(checklist, area).forEach((it) => {
      lookup[`${area}::${it.id}`] = it.name;
    });
  });
  (customItems || []).forEach((c) => {
    lookup[`${c.area}::${c.id}`] = c.name;
  });
  return lookup;
}

// Group the entries by area (in the checklist's canonical order) for the report.
// Each item carries its resolved name, status, remark and who/when.
function collectAreas(checklist, entries, keywords, customItems, statusOrder) {
  const nameLookup = buildNameLookup(checklist, customItems);

  // Rank each status by the canonical order (accepted, pending-install, …) so
  // items within an area are listed in that sequence.
  const rank = {};
  (statusOrder || []).forEach((s, i) => {
    rank[s] = i;
  });
  const statusRank = (s) => (s in rank ? rank[s] : 999);

  const byArea = {};
  const immediate = [];
  (entries || []).forEach((e) => {
    if (!e.status) return;
    const rec = { ...e, item: nameLookup[`${e.area}::${e.itemId}`] || e.itemId };
    (byArea[e.area] ||= []).push(rec);
    if (e.remarks && isImmediateAction(e.remarks, keywords)) immediate.push(rec);
  });

  const sortItems = (list) =>
    list.slice().sort((a, b) => {
      const sr = statusRank(a.status) - statusRank(b.status);
      if (sr !== 0) return sr;
      const ra = a.room || '';
      const rb = b.room || '';
      if (ra !== rb) return ra.localeCompare(rb, undefined, { numeric: true });
      return String(a.itemId).localeCompare(String(b.itemId), undefined, { numeric: true });
    });

  const order = Object.keys(checklist);
  const areas = order
    .filter((a) => (byArea[a] || []).length)
    .map((area) => ({ area, items: sortItems(byArea[area]) }));
  // Safety: append any areas not present in the template (e.g. renamed sections).
  Object.keys(byArea).forEach((a) => {
    if (!order.includes(a)) areas.push({ area: a, items: sortItems(byArea[a]) });
  });

  return { areas, immediate };
}

// Keep only entries last updated within [from, to] (inclusive, local time) and,
// when a user is chosen, only that user's entries. Empty bounds = unbounded.
function filterEntries(entries, { from, to, userId }) {
  const start = from ? new Date(`${from}T00:00:00`) : null;
  const end = to ? new Date(`${to}T23:59:59.999`) : null;
  return (entries || []).filter((e) => {
    if (userId && String(e.updatedBy || '') !== String(userId)) return false;
    if (start || end) {
      const t = e.updatedAt ? new Date(e.updatedAt) : null;
      if (!t || Number.isNaN(t.getTime())) return false;
      if (start && t < start) return false;
      if (end && t > end) return false;
    }
    return true;
  });
}

function formatDay(value) {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Today's local date as a YYYY-MM-DD string (matches the <input type="date"> value).
function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function RowLine({ rec }) {
  return (
    <div className="py-2.5">
      <div className="flex flex-wrap items-baseline gap-x-1.5 text-xs">
        <span className="font-semibold text-ink">
          {rec.area}
          {rec.room ? ` · Room ${rec.room}` : ''}
        </span>
        <span className="text-stone-300">—</span>
        <span className="text-stone-600">{rec.item}</span>
      </div>
      {rec.remarks && <div className="mt-0.5 text-xs italic text-stone-500">“{rec.remarks}”</div>}
      {rec.updatedAt && (
        <div className="mt-0.5 text-[10px] text-stone-400">{formatDateTime(rec.updatedAt)}</div>
      )}
    </div>
  );
}

export default function Signoff() {
  const { data: cl, isLoading: l1, error: e1 } = useChecklist();
  const { data: entries, isLoading: l2, error: e2 } = useEntries();
  const { data: finalData } = useFinalSignoff();
  const { data: handover } = useHandover();
  const { data: customItems } = useCustomItems();
  const finalise = useFinalise();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const { data: users } = useUsers({ enabled: isAdmin });

  const finalised = !!handover?.finalised;
  const existing = finalData?.finalSignoff;
  const isViewer = user?.role === 'viewer';

  const [hga, setHga] = useState({ name: '', designation: '' });
  const [cph, setCph] = useState({ name: '', designation: '' });
  const [formError, setFormError] = useState('');
  const [touched, setTouched] = useState(false);

  // Download-report filters. Non-admins are locked to their own entries; admins
  // may pick any user (or all). Empty date bounds mean "all dates".
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportUserId, setReportUserId] = useState('');

  // Prefill from the existing record or the logged-in user (once).
  useEffect(() => {
    if (touched) return;
    if (existing) {
      setHga({ name: existing.hariganga?.name || '', designation: existing.hariganga?.designation || '' });
      setCph({ name: existing.cph?.name || '', designation: existing.cph?.designation || '' });
    } else if (user) {
      if (user.role === 'hariganga' || user.role === 'admin') {
        setHga((p) => (p.name ? p : { name: user.name, designation: user.designation || '' }));
      }
      if (user.role === 'cph' || user.role === 'admin') {
        setCph((p) => (p.name ? p : { name: user.name, designation: user.designation || '' }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, user]);

  if (l1 || l2) return <LoadingScreen />;
  if (e1 || e2) return <ErrorBox error={e1 || e2} />;

  const checklist = cl.checklist;
  const { byStatus, immediate } = collect(checklist, entries, cl.immediateKeywords, customItems);
  const nextVisit = byStatus['next-visit'] || [];
  const hasAny = Object.values(byStatus).some((l) => l.length);

  const onDownload = () => {
    // Non-admins always export their own work; admins choose (blank = everyone).
    const effectiveUserId = isAdmin ? reportUserId : user?.id;
    const filtered = filterEntries(entries, { from: fromDate, to: toDate, userId: effectiveUserId });
    const { areas: repAreas, immediate: repImmediate } = collectAreas(
      checklist,
      filtered,
      cl.immediateKeywords,
      customItems,
      cl.statusOrder
    );

    let dateLabel = 'All dates';
    if (fromDate && toDate) {
      dateLabel = fromDate === toDate ? formatDay(fromDate) : `${formatDay(fromDate)} – ${formatDay(toDate)}`;
    } else if (fromDate) dateLabel = `From ${formatDay(fromDate)}`;
    else if (toDate) dateLabel = `Up to ${formatDay(toDate)}`;

    let userLabel = 'All users';
    if (!isAdmin) userLabel = user?.name || 'Your entries';
    else if (reportUserId) {
      userLabel = (users || []).find((u) => String(u.id) === String(reportUserId))?.name || 'Selected user';
    }

    downloadSignoffReport({
      handover,
      areas: repAreas,
      immediate: repImmediate,
      existing,
      finalised,
      filterSummary: { dateLabel, userLabel },
      generatedAt: formatDateTime(new Date()),
    });
  };

  const onFinalise = async () => {
    setFormError('');
    if (!hga.name.trim() || !cph.name.trim()) {
      setFormError('Please fill in both signatory names before finalising.');
      return;
    }
    try {
      await finalise.mutateAsync({ hariganga: hga, cph });
    } catch (err) {
      setFormError(apiError(err, 'Could not finalise'));
    }
  };

  return (
    <div>
      <PageHeader title="Visit Sign-Off Sheet" subtitle="Centre Point Amravati · Official Record" />

      <div className="space-y-4">
        {/* Download report */}
        <div className="card p-5">
          <div className="text-sm font-semibold text-ink">Download Report</div>
          <p className="mb-3 mt-0.5 text-xs text-stone-500">
            Export the sign-off sheet as a printable PDF.{' '}
            {isAdmin
              ? 'Filter by date range and user, or leave blank for the full record.'
              : 'Filter by date range — the report covers your own entries.'}
          </p>
          {(() => {
            const today = todayStr();
            const isToday = fromDate === today && toDate === today;
            return (
              <button
                type="button"
                onClick={() => {
                  setFromDate(today);
                  setToDate(today);
                }}
                className={`mb-4 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  isToday
                    ? 'border-maroon bg-maroon text-white'
                    : 'border-stone-200 text-stone-600 hover:border-maroon/40 hover:text-maroon'
                }`}
              >
                Today
              </button>
            );
          })()}
          <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="input-label">From date</div>
              <input
                type="date"
                className="field"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <div className="input-label">To date</div>
              <input
                type="date"
                className="field"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            {isAdmin ? (
              <div>
                <div className="input-label">User</div>
                <select
                  className="field"
                  value={reportUserId}
                  onChange={(e) => setReportUserId(e.target.value)}
                >
                  <option value="">All users</option>
                  {(users || []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <div className="input-label">User</div>
                <input className="field bg-stone-50 text-stone-500" value={user?.name || ''} disabled />
              </div>
            )}
            <button onClick={onDownload} className="btn btn-primary">
              <Download className="h-4 w-4" /> Download
            </button>
          </div>
          {(fromDate || toDate || reportUserId) && (
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
                setReportUserId('');
              }}
              className="mt-3 text-xs font-medium text-maroon hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Immediate actions */}
        {immediate.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-maroon/20 bg-maroon-light">
            <div className="flex items-center gap-2 border-b border-maroon/10 px-4 py-3 text-sm font-semibold text-maroon">
              <AlertTriangle className="h-4 w-4" />
              Immediate Action Needed by Hariganga
              <span className="badge bg-maroon text-white">{immediate.length}</span>
            </div>
            <div className="divide-y divide-maroon/10 px-4">
              {immediate.map((rec, i) => (
                <div key={i} className="py-2.5 text-xs">
                  <span className="font-semibold text-maroon">
                    {i + 1}. {rec.area}
                    {rec.room ? ` · Room ${rec.room}` : ''}
                  </span>
                  <span className="text-ink"> — {rec.item}</span>
                  <div className="mt-0.5 italic text-stone-600">{rec.remarks}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasAny && (
          <EmptyState
            icon={ClipboardList}
            title="Nothing recorded yet"
            description="Set statuses on the checklist items and they'll be grouped here for sign-off."
          />
        )}

        {/* Status sections */}
        {cl.statusOrder.map((sv) => {
          const list = byStatus[sv] || [];
          if (!list.length) return null;
          const section = STATUS_SECTION[sv] || {};
          const isHga = HGA_SCOPE.has(sv);
          return (
            <div key={sv} className="card overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: section.bg }}
              >
                <div
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: STATUS_COLOR[sv] }}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[sv] }} />
                  {STATUS_LABEL[sv]}
                  <span
                    className="badge"
                    style={{ background: 'rgba(255,255,255,0.65)', color: STATUS_COLOR[sv] }}
                  >
                    {list.length}
                  </span>
                </div>
                {isHga && <span className="badge bg-maroon text-white">Hariganga Scope</span>}
              </div>
              <div className="divide-y divide-stone-100 px-4">
                {list.map((rec, i) => (
                  <RowLine key={i} rec={rec} />
                ))}
              </div>
            </div>
          );
        })}

        {/* Punch-list note */}
        {nextVisit.length > 0 && (
          <div className="flex items-start gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
            <span>
              <strong className="font-semibold text-ink">{nextVisit.length} items</strong> marked
              “Next Visit” are on the punch list for the upcoming visit.
            </span>
          </div>
        )}

        {/* Final sign-off */}
        <div className="card p-5">
          <div className="mb-4 text-sm font-semibold text-ink">Final Sign-off</div>

          {finalised && existing ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              <div className="flex items-center gap-1.5 font-semibold">
                <Check className="h-4 w-4" /> Handover record finalised
                {existing.finalisedAt ? ` on ${formatDateTime(existing.finalisedAt)}` : ''}.
              </div>
              <div className="mt-2 text-xs text-emerald-900/80">
                Hariganga: {existing.hariganga?.name}
                {existing.hariganga?.designation ? ` (${existing.hariganga.designation})` : ''} · CPH:{' '}
                {existing.cph?.name}
                {existing.cph?.designation ? ` (${existing.cph.designation})` : ''}
              </div>
            </div>
          ) : isViewer ? (
            <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-600">
              Your account has view-only access. You can review the sign-off sheet but cannot
              finalise the record.
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <div className="input-label">Hariganga — Authorised Signatory</div>
                  <input
                    className="field mb-2"
                    placeholder="Full name"
                    value={hga.name}
                    onChange={(e) => {
                      setTouched(true);
                      setHga({ ...hga, name: e.target.value });
                    }}
                  />
                  <input
                    className="field"
                    placeholder="Designation"
                    value={hga.designation}
                    onChange={(e) => {
                      setTouched(true);
                      setHga({ ...hga, designation: e.target.value });
                    }}
                  />
                </div>
                <div>
                  <div className="input-label">CPH — Authorised Signatory</div>
                  <input
                    className="field mb-2"
                    placeholder="Full name"
                    value={cph.name}
                    onChange={(e) => {
                      setTouched(true);
                      setCph({ ...cph, name: e.target.value });
                    }}
                  />
                  <input
                    className="field"
                    placeholder="Designation"
                    value={cph.designation}
                    onChange={(e) => {
                      setTouched(true);
                      setCph({ ...cph, designation: e.target.value });
                    }}
                  />
                </div>
              </div>

              <button onClick={onFinalise} disabled={finalise.isPending} className="btn btn-primary mt-5">
                <Check className="h-4 w-4" /> {finalise.isPending ? 'Finalising…' : 'Finalise Record'}
              </button>

              {formError && <div className="mt-3 text-sm text-maroon">{formError}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
