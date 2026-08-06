import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChangePassword } from '../lib/queries';
import { apiError } from '../lib/api';
import { PageHeader, Spinner } from '../components/ui';

// Admins may replace their password with a short numeric PIN; everyone else
// keeps the 8+ character rule (the server enforces the same policy).
const MODES = [
  { val: 'text', label: 'Text password' },
  { val: 'pin4', label: '4-digit PIN' },
  { val: 'pin6', label: '6-digit PIN' },
];

const PIN_LEN = { pin4: 4, pin6: 6 };

export default function ChangePassword() {
  const { user } = useAuth();
  const changePassword = useChangePassword();
  const isAdmin = user?.role === 'admin';

  const [mode, setMode] = useState('text');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const pinLen = PIN_LEN[mode];
  const noun = pinLen ? 'PIN' : 'password';

  const switchMode = (m) => {
    setMode(m);
    setNext('');
    setConfirm('');
    setError('');
    setDone(false);
  };

  // In PIN modes only digits are accepted, capped at the PIN length.
  const clean = (v) => (pinLen ? v.replace(/\D/g, '').slice(0, pinLen) : v);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDone(false);
    if (pinLen && next.length !== pinLen) {
      setError(`PIN must be exactly ${pinLen} digits`);
      return;
    }
    if (!pinLen && next.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (next !== confirm) {
      setError(`The two ${noun}s do not match`);
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword: current, newPassword: next });
      setDone(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(apiError(err, 'Could not change password'));
    }
  };

  const pinProps = pinLen
    ? { inputMode: 'numeric', pattern: '[0-9]*', maxLength: pinLen }
    : { minLength: 8 };

  return (
    <div>
      <PageHeader
        title="Change Password"
        subtitle="Update the credentials you use to sign in."
      />

      <form onSubmit={onSubmit} className="card max-w-md p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
          <KeyRound className="h-4 w-4 text-maroon" /> {user?.name}
        </div>

        <div className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-maroon/15 bg-maroon-light px-3 py-2.5 text-sm text-maroon"
            >
              {error}
            </div>
          )}
          {done && (
            <div
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700"
            >
              Your {noun} has been updated.
            </div>
          )}

          <div>
            <label htmlFor="current-password" className="input-label">
              Current password or PIN
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              className="field"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>

          {isAdmin && (
            <div>
              <span className="input-label">New password type</span>
              <div className="grid grid-cols-3 gap-1 rounded-lg border border-stone-200 bg-stone-50 p-1">
                {MODES.map((m) => (
                  <button
                    key={m.val}
                    type="button"
                    onClick={() => switchMode(m.val)}
                    className={`rounded-md px-2 py-1.5 text-xs font-medium transition ${
                      mode === m.val
                        ? 'bg-white text-maroon shadow-sm'
                        : 'text-stone-500 hover:text-ink'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-stone-400">
                As an administrator you can use a short numeric PIN instead of a full password.
              </p>
            </div>
          )}

          <div>
            <label htmlFor="new-password" className="input-label">
              {pinLen ? `New ${pinLen}-digit PIN` : 'New password'}
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              className="field"
              value={next}
              onChange={(e) => setNext(clean(e.target.value))}
              required
              {...pinProps}
            />
            {!pinLen && (
              <p className="mt-1.5 text-xs text-stone-400">At least 8 characters.</p>
            )}
          </div>

          <div>
            <label htmlFor="confirm-password" className="input-label">
              Confirm new {noun}
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              className="field"
              value={confirm}
              onChange={(e) => setConfirm(clean(e.target.value))}
              required
              {...pinProps}
            />
          </div>

          <button type="submit" disabled={changePassword.isPending} className="btn btn-primary w-full">
            {changePassword.isPending ? (
              <Spinner className="h-4 w-4 text-white" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {changePassword.isPending ? 'Updating…' : `Update ${noun}`}
          </button>
        </div>
      </form>
    </div>
  );
}
