import { Fragment, useState } from 'react';
import { Trash2, UserPlus, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import {
  useUsers,
  useChecklist,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '../lib/queries';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../lib/api';
import { PageHeader, LoadingScreen } from '../components/ui';
import { ErrorBox } from './Home';

const ROLES = [
  { val: 'admin', label: 'Administrator' },
  { val: 'hariganga', label: 'Hariganga' },
  { val: 'cph', label: 'CPH' },
];

const ROLE_TONE = {
  admin: 'bg-maroon-light text-maroon',
  hariganga: 'bg-indigo-50 text-indigo-700',
  cph: 'bg-sky-50 text-sky-700',
};

const EMPTY = { name: '', email: '', password: '', role: 'cph', designation: '', assignedAreas: [] };

function SectionPicker({ areas, selected, onToggle, onAll, onClear }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
          Sections this user can update ({selected.length})
        </span>
        <div className="flex gap-3 text-[11px] font-medium">
          <button type="button" onClick={onAll} className="text-maroon hover:underline">
            Select all
          </button>
          <button type="button" onClick={onClear} className="text-stone-500 hover:underline">
            Clear
          </button>
        </div>
      </div>
      <div className="grid max-h-52 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((a) => {
          const on = selected.includes(a);
          return (
            <label
              key={a}
              className={`flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs transition ${
                on ? 'bg-maroon-light text-maroon' : 'text-ink hover:bg-white'
              }`}
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-[#6f0e13]"
                checked={on}
                onChange={() => onToggle(a)}
              />
              <span className="truncate" title={a}>
                {a}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const { data: users, isLoading, error } = useUsers();
  const { data: cl } = useChecklist();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [expanded, setExpanded] = useState(null);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorBox error={error} />;

  const areas = cl ? Object.keys(cl.checklist) : [];
  const isAdminRole = form.role === 'admin';

  const onCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await createUser.mutateAsync({ ...form, assignedAreas: isAdminRole ? [] : form.assignedAreas });
      setForm(EMPTY);
    } catch (err) {
      setFormError(apiError(err, 'Could not create user'));
    }
  };

  const toggleFormArea = (area) =>
    setForm((f) => ({
      ...f,
      assignedAreas: f.assignedAreas.includes(area)
        ? f.assignedAreas.filter((a) => a !== area)
        : [...f.assignedAreas, area],
    }));

  const toggleUserArea = (u, area) => {
    const next = (u.assignedAreas || []).includes(area)
      ? u.assignedAreas.filter((a) => a !== area)
      : [...(u.assignedAreas || []), area];
    updateUser.mutate({ id: u.id, assignedAreas: next });
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Create accounts, assign roles, and choose which sections each user can update."
      />

      {/* Create form */}
      <form onSubmit={onCreate} className="card mb-5 p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
          <UserPlus className="h-4 w-4 text-maroon" /> Add User
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className="field"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="field"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="field"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <input
            className="field"
            placeholder="Designation (optional)"
            value={form.designation}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
          />
          <select
            className="field"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLES.map((r) => (
              <option key={r.val} value={r.val}>
                {r.label}
              </option>
            ))}
          </select>
          <button type="submit" disabled={createUser.isPending} className="btn btn-primary">
            {createUser.isPending ? 'Adding…' : 'Add User'}
          </button>
        </div>

        {isAdminRole ? (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-stone-500">
            <ShieldCheck className="h-3.5 w-3.5 text-maroon" /> Administrators can update every section.
          </div>
        ) : (
          <div className="mt-3">
            <SectionPicker
              areas={areas}
              selected={form.assignedAreas}
              onToggle={toggleFormArea}
              onAll={() => setForm((f) => ({ ...f, assignedAreas: [...areas] }))}
              onClear={() => setForm((f) => ({ ...f, assignedAreas: [] }))}
            />
          </div>
        )}

        {formError && <div className="mt-3 text-sm text-maroon">{formError}</div>}
      </form>

      {/* User list */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-left text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Name</th>
              <th className="px-4 py-2.5 font-semibold">Email</th>
              <th className="px-4 py-2.5 font-semibold">Role</th>
              <th className="px-4 py-2.5 font-semibold">Sections</th>
              <th className="px-4 py-2.5 font-semibold">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => {
              const isMe = u.id === me.id;
              const isAdmin = u.role === 'admin';
              const open = expanded === u.id;
              const count = (u.assignedAreas || []).length;
              return (
                <Fragment key={u.id}>
                  <tr className="transition hover:bg-stone-50/70">
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">
                        {u.name}
                        {isMe && <span className="ml-1.5 text-[10px] text-stone-400">(you)</span>}
                      </div>
                      {u.designation && <div className="text-xs text-stone-500">{u.designation}</div>}
                    </td>
                    <td className="px-4 py-3 text-stone-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        className={`rounded-md px-2 py-1 text-xs font-medium outline-none ring-1 ring-inset ring-transparent transition focus:ring-maroon/30 ${ROLE_TONE[u.role]} ${
                          isMe ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                        }`}
                        value={u.role}
                        disabled={isMe}
                        onChange={(e) => updateUser.mutate({ id: u.id, role: e.target.value })}
                      >
                        {ROLES.map((r) => (
                          <option key={r.val} value={r.val}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <span className="text-xs text-stone-400">All sections</span>
                      ) : (
                        <button
                          onClick={() => setExpanded(open ? null : u.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-xs font-medium text-ink transition hover:border-maroon/40 hover:bg-stone-50"
                        >
                          {open ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                          {count ? `${count} section${count > 1 ? 's' : ''}` : 'None'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => updateUser.mutate({ id: u.id, active: !u.active })}
                        disabled={isMe}
                        className={`badge ${
                          u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-500'
                        } ${isMe ? 'opacity-60' : 'hover:opacity-80'}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-stone-400'}`}
                        />
                        {u.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isMe && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${u.name}?`)) deleteUser.mutate(u.id);
                          }}
                          className="rounded-md p-1.5 text-stone-400 transition hover:bg-maroon-light hover:text-maroon"
                          title="Delete user"
                          aria-label={`Delete ${u.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                  {open && !isAdmin && (
                    <tr className="bg-stone-50/60">
                      <td colSpan={6} className="px-4 py-3">
                        <SectionPicker
                          areas={areas}
                          selected={u.assignedAreas || []}
                          onToggle={(a) => toggleUserArea(u, a)}
                          onAll={() => updateUser.mutate({ id: u.id, assignedAreas: [...areas] })}
                          onClear={() => updateUser.mutate({ id: u.id, assignedAreas: [] })}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
