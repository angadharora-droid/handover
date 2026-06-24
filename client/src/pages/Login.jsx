import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../lib/api';
import { Spinner } from '../components/ui';

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    return <Navigate to={location.state?.from?.pathname || '/'} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Invalid credentials'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-maroon to-maroon-dark p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold text-xs font-bold tracking-wide text-maroon">
            CPH
          </div>
          <span className="font-display text-lg font-semibold">Hariganga</span>
        </div>
        <div className="relative">
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Centre Point
            <br />
            Amravati Handover
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
            A single, structured record for the property handover between Hariganga and Centre Point
            Hospitality — every area, item, and sign-off in one place.
          </p>
        </div>
        <div className="relative text-xs text-white/45">© Hariganga · Centre Point Hospitality</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-paper px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-maroon text-xs font-bold tracking-wide text-gold">
              CPH
            </div>
          </div>

          <h2 className="font-display text-2xl font-semibold text-ink">Welcome back</h2>
          <p className="mt-1 text-sm text-stone-500">Sign in to continue to the handover.</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-maroon/15 bg-maroon-light px-3 py-2.5 text-sm text-maroon"
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="input-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="field pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-stone-400 hover:text-stone-600"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn btn-primary w-full">
              {busy ? <Spinner className="h-4 w-4 text-white" /> : <LogIn className="h-4 w-4" />}
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-stone-400">
            Accounts are created by an administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
