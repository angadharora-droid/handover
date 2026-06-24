import { Info } from 'lucide-react';
import { useChecklist, useUsers, useAssignArea } from '../lib/queries';
import { PageHeader, LoadingScreen, EmptyState } from '../components/ui';
import { ErrorBox } from './Home';

const ROLE_LABEL = { admin: 'Admin', hariganga: 'Hariganga', cph: 'CPH' };

export default function Assignments() {
  const { data: cl, isLoading: l1, error: e1 } = useChecklist();
  const { data: users, isLoading: l2, error: e2 } = useUsers();
  const assign = useAssignArea();

  if (l1 || l2) return <LoadingScreen />;
  if (e1 || e2) return <ErrorBox error={e1 || e2} />;

  const areas = Object.keys(cl.checklist);
  const columns = users.filter((u) => u.role !== 'admin' && u.active);

  const toggle = (area, userId) => {
    const current = users.filter((u) => (u.assignedAreas || []).includes(area)).map((u) => u.id);
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    assign.mutate({ area, userIds: next });
  };

  return (
    <div>
      <PageHeader
        title="Section Assignments"
        subtitle="Grant a user permission to update a section. Unassigned users see it read-only."
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-600">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
        Administrators can always edit every section. You can also manage these from each user's row on
        the <span className="font-medium text-ink">Users</span> screen.
      </div>

      {columns.length === 0 ? (
        <EmptyState
          title="No non-admin users yet"
          description="Create Hariganga / CPH users on the Users screen first, then assign them sections here."
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="sticky left-0 z-10 bg-stone-50 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  Section
                </th>
                {columns.map((u) => (
                  <th key={u.id} className="px-3 py-3 text-center">
                    <div className="text-xs font-semibold text-ink">{u.name}</div>
                    <div className="text-[10px] uppercase tracking-wide text-stone-400">
                      {ROLE_LABEL[u.role]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {areas.map((area) => {
                const count = columns.filter((u) => (u.assignedAreas || []).includes(area)).length;
                return (
                  <tr key={area} className="transition hover:bg-stone-50/70">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2.5 text-left">
                      <span className="font-medium text-ink">{area}</span>
                      <span className="ml-1.5 text-[10px] text-stone-400">
                        {count ? `${count} assigned` : 'unassigned'}
                      </span>
                    </td>
                    {columns.map((u) => {
                      const checked = (u.assignedAreas || []).includes(area);
                      return (
                        <td key={u.id} className="px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 cursor-pointer accent-[#6f0e13]"
                            checked={checked}
                            disabled={assign.isPending}
                            onChange={() => toggle(area, u.id)}
                            aria-label={`Assign ${area} to ${u.name}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
