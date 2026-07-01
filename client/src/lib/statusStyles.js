// Presentation constants for statuses. The structural status list comes from
// the API (val + label); these maps add the colours/icons the UI renders.

export const STATUS_LABEL = {
  '': 'Not started',
  accepted: 'Accepted',
  cph: 'CPH Scope',
  'pending-install': 'Pending – Installation',
  'docs-pending': 'Docs Pending',
  damaged: 'Damaged – Needs Repair',
  phase2: 'Phase 2',
  'next-visit': 'Next Visit',
  dropped: 'Dropped from List',
};

export const STATUS_ICON = {
  accepted: '✅',
  cph: '🏢',
  'pending-install': '⏳',
  'docs-pending': '📄',
  damaged: '⚠️',
  phase2: '🅿️',
  'next-visit': '📍',
  dropped: '✖️',
};

// Pastel pill colours for badges.
export const STATUS_BADGE = {
  '': { bg: '#f1efe8', text: '#6b6a64' },
  accepted: { bg: '#eaf3de', text: '#27500a' },
  cph: { bg: '#ddf1f0', text: '#0a5f5f' },
  'pending-install': { bg: '#faeeda', text: '#633806' },
  'docs-pending': { bg: '#e6f1fb', text: '#0c447c' },
  damaged: { bg: '#fcebeb', text: '#791f1f' },
  phase2: { bg: '#eeedfe', text: '#3c3489' },
  'next-visit': { bg: '#fbeaf0', text: '#72243e' },
  dropped: { bg: '#f1efe8', text: '#444441' },
};

// Solid colours for progress bars / text.
export const STATUS_COLOR = {
  accepted: '#27500a',
  cph: '#0a5f5f',
  'pending-install': '#633806',
  'docs-pending': '#0c447c',
  damaged: '#791f1f',
  phase2: '#3c3489',
  'next-visit': '#72243e',
  dropped: '#444441',
  '': '#b4b2a9',
};

// Vivid colours for the donut chart.
export const PIE_COLORS = {
  accepted: '#27500a',
  cph: '#14a89e',
  'pending-install': '#ef9f27',
  'docs-pending': '#185fa5',
  damaged: '#e24b4a',
  phase2: '#7f77dd',
  'next-visit': '#d4537e',
  dropped: '#888780',
  '': '#d3d1c7',
};

// Section background / border for the sign-off sheet.
export const STATUS_SECTION = {
  accepted: { bg: '#eaf3de', border: '#c0dd97' },
  cph: { bg: '#ddf1f0', border: '#a9dedb' },
  'pending-install': { bg: '#faeeda', border: '#fac775' },
  'docs-pending': { bg: '#e6f1fb', border: '#b5d4f4' },
  damaged: { bg: '#fcebeb', border: '#f7c1c1' },
  phase2: { bg: '#eeedfe', border: '#cecbf6' },
  'next-visit': { bg: '#fbeaf0', border: '#f4c0d1' },
  dropped: { bg: '#f1efe8', border: '#d3d1c7' },
};

// Item percent-complete pill colour buckets (area cards).
export function pctClasses(pct) {
  if (pct === 0) return 'bg-[#fcebeb] text-[#791f1f]';
  if (pct < 33) return 'bg-[#faeeda] text-[#633806]';
  if (pct < 75) return 'bg-[#e6f1fb] text-[#0c447c]';
  return 'bg-[#eaf3de] text-[#27500a]';
}
