import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, TOKEN_KEY } from '../lib/api';
import { resolveSsoToken, ssoEnabled, ssoLogout } from '../lib/sso';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      if (!ssoEnabled()) {
        setLoading(false);
        return undefined;
      }
      // Central sign-on: no local session, so accept the portal's sign-on if
      // the visitor has one. Stores the token exactly as `login` does; on any
      // miss the login page is shown as before. `loading` stays true meanwhile.
      let cancelled = false;
      resolveSsoToken()
        .then((ssoToken) => (ssoToken && !cancelled ? api.post('/auth/sso', { token: ssoToken }) : null))
        .then((r) => {
          if (cancelled || !r?.data?.token) return;
          localStorage.setItem(TOKEN_KEY, r.data.token);
          setUser(r.data.user);
        })
        .catch(() => {
          /* not linked or auth service unreachable; fall through to the login page */
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }
    api
      .get('/auth/me')
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  // identifier is an email, or a phone number for admin accounts.
  const login = useCallback(async (identifier, password) => {
    const r = await api.post('/auth/login', { identifier, password });
    localStorage.setItem(TOKEN_KEY, r.data.token);
    setUser(r.data.user);
    return r.data.user;
  }, []);

  const logout = useCallback(() => {
    // Also end the portal session, otherwise the next page load would sign
    // straight back in through SSO. No-op unless VITE_AUTH_URL is set.
    ssoLogout();
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
