// In-memory throttle for login attempts. The server runs as a single process,
// so a Map is enough; counters reset on restart.
//
// Two counters guard the endpoint:
//  - per identifier (email / phone), so one account can't be brute-forced —
//    this matters especially now that admins may use a 4-digit PIN
//  - per IP, so one client can't spray attempts across many accounts
// A key that crosses its limit is locked out for LOCK_MS.

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_PER_IDENTIFIER = 5;
const MAX_PER_IP = 20;

const failures = new Map(); // key -> { count, windowStart, lockedUntil }

// Returns the live entry for a key, dropping it if its window or lock expired.
function entryFor(key, now) {
  const e = failures.get(key);
  if (!e) return null;
  const expired = e.lockedUntil ? e.lockedUntil <= now : now - e.windowStart > WINDOW_MS;
  if (expired) {
    failures.delete(key);
    return null;
  }
  return e;
}

export function loginBlocked(ip, identifierKey) {
  const now = Date.now();
  const byIp = entryFor(`ip:${ip}`, now);
  const byId = entryFor(`id:${identifierKey}`, now);
  return Boolean(byIp?.lockedUntil || byId?.lockedUntil);
}

export function recordLoginFailure(ip, identifierKey) {
  const now = Date.now();
  bump(`ip:${ip}`, MAX_PER_IP, now);
  bump(`id:${identifierKey}`, MAX_PER_IDENTIFIER, now);
  // A spray attack could grow the map without bound — sweep expired keys.
  if (failures.size > 5000) {
    for (const key of failures.keys()) entryFor(key, now);
  }
}

export function clearLoginFailures(identifierKey) {
  failures.delete(`id:${identifierKey}`);
}

function bump(key, max, now) {
  let e = entryFor(key, now);
  if (!e) {
    e = { count: 0, windowStart: now, lockedUntil: 0 };
    failures.set(key, e);
  }
  e.count += 1;
  if (e.count >= max) e.lockedUntil = now + LOCK_MS;
}
