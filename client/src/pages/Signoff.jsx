import { useEffect, useState } from 'react';
import { AlertTriangle, Info, Check, ClipboardList } from 'lucide-react';
import {
  useChecklist,
  useEntries,
  useFinalSignoff,
  useFinalise,
  useHandover,
  useCustomItems,
} from '../lib/queries';
import { getItems, isImmediateAction } from '../lib/checklist';
import { STATUS_LABEL, STATUS_SECTION, STATUS_COLOR } from '../lib/statusStyles';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../lib/format';
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

  const finalised = !!handover?.finalised;
  const existing = finalData?.finalSignoff;
  const isViewer = user?.role === 'viewer';

  const [hga, setHga] = useState({ name: '', designation: '' });
  const [cph, setCph] = useState({ name: '', designation: '' });
  const [formError, setFormError] = useState('');
  const [touched, setTouched] = useState(false);

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
