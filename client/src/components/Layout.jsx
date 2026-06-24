import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  LayoutDashboard,
  ClipboardCheck,
  SlidersHorizontal,
  History,
  Users,
  LogOut,
  Menu,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHandover } from '../lib/queries';

const ROLE_LABEL = { admin: 'Administrator', hariganga: 'Hariganga', cph: 'CPH' };

const MAIN_NAV = [
  { to: '/', label: 'Areas', icon: LayoutGrid, end: true },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/signoff', label: 'Sign-off', icon: ClipboardCheck },
];
const ADMIN_NAV = [
  { to: '/assignments', label: 'Assignments', icon: SlidersHorizontal },
  { to: '/audit', label: 'Audit', icon: History },
  { to: '/users', label: 'Users', icon: Users },
];

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function navItemClass({ isActive }) {
  return [
    'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-white/10 text-white'
      : 'text-white/65 hover:bg-white/5 hover:text-white',
  ].join(' ');
}

function NavSection({ label, items, onNavigate }) {
  return (
    <div className="px-3">
      <div className="px-3 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-widest text-white/35">
        {label}
      </div>
      <nav className="space-y-0.5">
        {items.map(({ to, label: l, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={navItemClass}>
            {({ isActive }) => (
              <>
                <span
                  className={`absolute left-0 top-1/2 h-5 -translate-y-1/2 rounded-r bg-gold transition-all ${
                    isActive ? 'w-1' : 'w-0'
                  }`}
                />
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {l}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function SidebarContent({ user, onLogout, onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-maroon to-maroon-dark text-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-[11px] font-bold tracking-wide text-maroon shadow-sm">
          CPH
        </div>
        <div className="leading-tight">
          <div className="font-display text-[15px] font-semibold">Hariganga</div>
          <div className="text-[11px] text-white/55">CPH Handover</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <NavSection label="Workspace" items={MAIN_NAV} onNavigate={onNavigate} />
        {user?.role === 'admin' && (
          <NavSection label="Administration" items={ADMIN_NAV} onNavigate={onNavigate} />
        )}
      </div>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">
            {initials(user?.name)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-medium text-white">{user?.name}</div>
            <div className="text-[11px] text-gold/90">{ROLE_LABEL[user?.role] || user?.role}</div>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            aria-label="Sign out"
            className="rounded-md p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { data: handover } = useHandover();
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState(false);

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh shadow-sidebar lg:block">
        <SidebarContent user={user} onLogout={onLogout} />
      </aside>

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-40 lg:hidden ${drawer ? '' : 'pointer-events-none'}`}>
        <div
          onClick={() => setDrawer(false)}
          className={`absolute inset-0 bg-ink/50 transition-opacity ${
            drawer ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`absolute inset-y-0 left-0 w-[260px] transition-transform duration-300 ${
            drawer ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <button
            onClick={() => setDrawer(false)}
            aria-label="Close menu"
            className="absolute right-3 top-4 z-10 rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarContent user={user} onLogout={onLogout} onNavigate={() => setDrawer(false)} />
        </div>
      </div>

      {/* Main column */}
      <div className="flex min-w-0 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-200 bg-paper/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-stone-600 hover:bg-stone-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-maroon text-[9px] font-bold text-gold">
              CPH
            </div>
            <span className="font-display text-sm font-semibold text-ink">CPH Handover</span>
          </div>
        </header>

        {handover?.finalised && (
          <div className="flex items-center justify-center gap-1.5 bg-emerald-700 px-4 py-1.5 text-center text-xs font-medium text-white">
            <Lock className="h-3.5 w-3.5" /> This handover record has been finalised.
          </div>
        )}

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
