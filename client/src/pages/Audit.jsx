import { useState } from 'react';
import { ArrowRight, CheckCircle2, History } from 'lucide-react';
import { useAudit, useDailyLog, useChecklist, useUsers } from '../lib/queries';
import { STATUS_LABEL, STATUS_BADGE } from '../lib/statusStyles';
import { formatDateTime } from '../lib/format';
import { PageHeader, LoadingScreen, EmptyState, Spinner } from '../components/ui';
import { ErrorBox } from './Home';

function StatusChip({ status }) {
  const s = status || '';
  const c = STATUS_BADGE[s] || STATUS_BADGE[''];
  return (
    <span className="badge" style={{ background: c.bg, color: c.text }}>
      {STATUS_LABEL[s]}
    </span>
  );
}

function formatDay(day) {
  const d = new Date(`${day}T00:00:00`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function Activity() {
  const [area, setArea] = useState('');
  const [userId, setUserId] = useState('');
  const { data: cl } = useChecklist();
  const { data: users } = useUsers();
  const { data: logs, isLoading, error } = useAudit({ area, userId });

  const areas = cl ? Object.keys(cl.checklist) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select className="field max-w-xs" value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">All sections</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select className="field max-w-xs" value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">All users</option>
          {(users || []).map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        {(area || userId) && (
          <button
            onClick={() => {
              setArea('');
              setUserId('');
            }}
            className="text-sm font-medium text-maroon hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      )}
      {error && <ErrorBox error={error} />}

      {logs && logs.length === 0 && (
        <EmptyState icon={History} title="No changes yet" description="No changes recorded for this filter." />
      )}

      {logs && logs.length > 0 && (
        <div className="card divide-y divide-stone-100 overflow-hidden">
          {logs.map((log) => {
            const statusChanged = (log.oldStatus || '') !== (log.newStatus || '');
            const remarksChanged = (log.oldRemarks || '') !== (log.newRemarks || '');
            return (
              <div key={log._id} className="px-4 py-3 text-sm transition hover:bg-stone-50/70">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <div className="font-medium text-ink">
                    {log.area}
                    {log.room ? ` · Room ${log.room}` : ''}
                    <span className="font-normal text-stone-500"> — {log.itemName}</span>
                  </div>
                  <div className="text-xs text-stone-400 tnum">
                    {log.userName} · {formatDateTime(log.createdAt)}
                  </div>
                </div>

                {statusChanged && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <StatusChip status={log.oldStatus} />
                    <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
                    <StatusChip status={log.newStatus} />
                  </div>
                )}

                {remarksChanged && (
                  <div className="mt-1.5 text-xs text-stone-600">
                    <span className="text-stone-400">Remark: </span>
                    {log.newRemarks ? (
                      <span className="italic">“{log.newRemarks}”</span>
                    ) : (
                      <span className="italic text-stone-400">cleared</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DailyLog() {
  const { data: days, isLoading, error } = useDailyLog();

  if (isLoading)
    return (
      <div className="flex justify-center py-10">
        <Spinner className="h-6 w-6" />
      </div>
    );
  if (error) return <ErrorBox error={error} />;
  if (!days || days.length === 0) {
    return <EmptyState icon={History} title="No activity yet" description="Changes will be summarised here by day." />;
  }

  return (
    <div className="space-y-4">
      {days.map((d) => (
        <div key={d.date} className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50 px-4 py-3">
            <div className="text-sm font-semibold text-ink">{formatDay(d.date)}</div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-stone-500 tnum">
                <strong className="text-ink">{d.total}</strong> updates
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700 tnum">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {d.completed} completed
              </span>
            </div>
          </div>
          <div className="divide-y divide-stone-100">
            {d.users.map((u) => (
              <div
                key={u.userId || u.userName}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2 text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-100 text-[10px] font-semibold text-stone-500">
                    {(u.userName || '?').slice(0, 1).toUpperCase()}
                  </span>
                  {u.userName}
                </span>
                <span className="text-xs text-stone-500 tnum">
                  {u.total} updates
                  {u.completed > 0 && <span className="text-emerald-700"> · {u.completed} completed</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Audit() {
  const [tab, setTab] = useState('activity');
  const tabs = [
    ['activity', 'Activity'],
    ['daily', 'Daily Log'],
  ];

  return (
    <div>
      <PageHeader title="Change Audit" subtitle="Every status and remark change, by whom and when." />

      <div className="mb-5 inline-flex rounded-lg border border-stone-200 bg-stone-100 p-0.5">
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

      {tab === 'activity' ? <Activity /> : <DailyLog />}
    </div>
  );
}
