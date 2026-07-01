// Pure helpers for deriving progress from the checklist template, the saved
// entries, and any user-added ("Other") custom items.

// An item counts as "done" (and toward the completion percentage) only once it
// reaches a closed state — accepted, CPH scope, or dropped from the list. Items
// that are merely touched (pending / damaged / docs-pending / next-visit /
// phase 2) are NOT complete. CPH is treated as accepted for the percentage.
export const COMPLETED_STATUSES = ['accepted', 'cph', 'dropped'];

// Statuses only an administrator may apply (mirrors the server).
export const ADMIN_ONLY_STATUSES = ['phase2', 'dropped'];

export function isCompleted(status) {
  return COMPLETED_STATUSES.includes(status);
}

export function entryKey(area, room, itemId) {
  return room ? `${area}::${room}::${itemId}` : `${area}::${itemId}`;
}

export function buildEntryMap(entries) {
  const map = {};
  (entries || []).forEach((e) => {
    map[entryKey(e.area, e.room, e.itemId)] = e;
  });
  return map;
}

// ---- Custom ("Other") items ----------------------------------------------

export function customKey(area, room) {
  return `${area}::${room || ''}`;
}

export function buildCustomMap(items) {
  const map = {};
  (items || []).forEach((it) => {
    const k = customKey(it.area, it.room);
    (map[k] ||= []).push({ id: it.id, name: it.name, isCustom: true });
  });
  return map;
}

export function customItemsFor(customMap, area, room) {
  return (customMap && customMap[customKey(area, room)]) || [];
}

export function staticItems(checklist, area) {
  const a = checklist?.[area];
  return a ? a.items || [] : [];
}

// Backwards-compatible alias used where only the template items are needed.
export const getItems = staticItems;

// Full item list for a given area/room: template items + custom items.
export function itemsFor(checklist, area, room, customMap) {
  return [...staticItems(checklist, area), ...customItemsFor(customMap, area, room)];
}

export function getEntry(map, area, room, itemId) {
  return map[entryKey(area, room, itemId)] || { status: '', remarks: '' };
}

// ---- Progress -------------------------------------------------------------

export function getAreaProgress(checklist, area, map, customMap) {
  const a = checklist[area];
  let total = 0;
  let done = 0;
  const counts = {};

  const tally = (room) =>
    itemsFor(checklist, area, room, customMap).forEach((it) => {
      total += 1;
      const s = getEntry(map, area, room, it.id).status;
      if (s) counts[s] = (counts[s] || 0) + 1;
      if (isCompleted(s)) done += 1;
    });

  if (a?.isRooms) a.floors.forEach((f) => tally(f.num));
  else tally(null);

  return { total, done, pct: total ? Math.round((done / total) * 100) : 0, counts };
}

export function getRoomProgress(checklist, area, room, map, customMap) {
  const items = itemsFor(checklist, area, room, customMap);
  let done = 0;
  items.forEach((it) => {
    if (isCompleted(getEntry(map, area, room, it.id).status)) done += 1;
  });
  return { total: items.length, done, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
}

export function getAllStatusCounts(checklist, map, customMap) {
  const counts = { '': 0 };
  Object.keys(checklist).forEach((area) => {
    const a = checklist[area];
    const tally = (room) =>
      itemsFor(checklist, area, room, customMap).forEach((it) => {
        const s = getEntry(map, area, room, it.id).status || '';
        counts[s] = (counts[s] || 0) + 1;
      });
    if (a.isRooms) a.floors.forEach((f) => tally(f.num));
    else tally(null);
  });
  return counts;
}

export function getTotals(checklist, map, customMap) {
  let total = 0;
  let done = 0;
  Object.keys(checklist).forEach((area) => {
    const p = getAreaProgress(checklist, area, map, customMap);
    total += p.total;
    done += p.done;
  });
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function isImmediateAction(remarks, keywords) {
  if (!remarks) return false;
  const r = remarks.toLowerCase();
  return (keywords || []).some((kw) => r.includes(kw));
}
