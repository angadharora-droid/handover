// Builds a self-contained, print-ready HTML version of the Visit Sign-Off
// Sheet and opens it in a new window so the user can "Save as PDF" / print.
// Kept dependency-free: everything (styles + the auto-print hook) is inlined
// into the document, so the downloaded/printed file stands alone.

import { STATUS_LABEL, STATUS_COLOR, STATUS_SECTION } from './statusStyles';
import { formatDateTime } from './format';

// Mirrors Signoff.jsx: statuses that are Hariganga's outstanding scope.
const HGA_SCOPE = new Set(['pending-install', 'docs-pending', 'damaged', 'phase2', 'next-visit']);

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function rowHtml(rec, idx) {
  const where = `${esc(rec.area)}${rec.room ? ` · Room ${esc(rec.room)}` : ''}`;
  const remark = rec.remarks ? `<div class="remark">“${esc(rec.remarks)}”</div>` : '';
  const stamp = [rec.updatedByName, rec.updatedAt ? formatDateTime(rec.updatedAt) : '']
    .filter(Boolean)
    .map(esc)
    .join(' · ');
  return `
    <tr>
      <td class="num">${idx + 1}</td>
      <td>
        <div class="where">${where}</div>
        <div class="item">${esc(rec.item)}</div>
        ${remark}
      </td>
      <td class="stamp">${stamp}</td>
    </tr>`;
}

function sectionHtml(sv, list) {
  const color = STATUS_COLOR[sv] || '#444441';
  const section = STATUS_SECTION[sv] || {};
  const scopeTag = HGA_SCOPE.has(sv) ? '<span class="scope">Hariganga Scope</span>' : '';
  return `
    <section class="block">
      <div class="block-head" style="background:${section.bg || '#f1efe8'};border-color:${section.border || '#ddd'}">
        <div class="block-title" style="color:${color}">
          <span class="dot" style="background:${color}"></span>
          ${esc(STATUS_LABEL[sv] || sv)}
          <span class="count" style="color:${color}">${list.length}</span>
        </div>
        ${scopeTag}
      </div>
      <table>
        <tbody>${list.map(rowHtml).join('')}</tbody>
      </table>
    </section>`;
}

export function buildSignoffReportHtml({
  handover,
  byStatus,
  immediate,
  statusOrder,
  existing,
  finalised,
  filterSummary,
  generatedAt,
}) {
  const title = handover?.name || 'Visit Sign-Off Sheet';
  const subParts = [handover?.code, handover?.location].filter(Boolean).map(esc).join(' · ');

  const sections = (statusOrder || [])
    .filter((sv) => (byStatus[sv] || []).length)
    .map((sv) => sectionHtml(sv, byStatus[sv]))
    .join('');

  const totalItems = Object.values(byStatus).reduce((n, l) => n + l.length, 0);

  const immediateHtml = (immediate || []).length
    ? `
      <section class="block immediate">
        <div class="block-head" style="background:#fcefee;border-color:#f0b9b6">
          <div class="block-title" style="color:#6f0e13">
            <span class="dot" style="background:#6f0e13"></span>
            Immediate Action Needed by Hariganga
            <span class="count" style="color:#6f0e13">${immediate.length}</span>
          </div>
        </div>
        <table><tbody>${immediate.map(rowHtml).join('')}</tbody></table>
      </section>`
    : '';

  const sig = (label, party) => `
    <div class="sig">
      <div class="sig-label">${esc(label)}</div>
      ${
        party?.name
          ? `<div class="sig-name">${esc(party.name)}</div>
             <div class="sig-desig">${esc(party.designation || '')}</div>`
          : `<div class="sig-line"></div><div class="sig-desig">Name &amp; designation</div>`
      }
    </div>`;

  const finalBlock = `
    <section class="final">
      <div class="final-title">Final Sign-off</div>
      ${
        finalised && existing
          ? `<div class="final-note">Handover record finalised${
              existing.finalisedAt ? ` on ${esc(formatDateTime(existing.finalisedAt))}` : ''
            }.</div>`
          : '<div class="final-note muted">Pending finalisation.</div>'
      }
      <div class="sigs">
        ${sig('Hariganga — Authorised Signatory', existing?.hariganga)}
        ${sig('CPH — Authorised Signatory', existing?.cph)}
      </div>
    </section>`;

  const emptyHtml = totalItems === 0 && (immediate || []).length === 0
    ? '<div class="empty">No items match the selected filters.</div>'
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)} — Sign-Off Report</title>
<style>
  :root { --maroon:#6f0e13; --ink:#1c1b1a; --muted:#6b6a64; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    color: var(--ink); margin: 0; background: #f6f5f2; line-height: 1.45;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .sheet { max-width: 820px; margin: 0 auto; padding: 32px 36px 56px; background: #fff; }
  .toolbar { text-align: center; padding: 16px; }
  .toolbar button {
    font: inherit; font-weight: 600; color: #fff; background: var(--maroon);
    border: 0; border-radius: 8px; padding: 10px 18px; cursor: pointer;
  }
  header { border-bottom: 3px solid var(--maroon); padding-bottom: 14px; margin-bottom: 18px; }
  h1 { font-family: Fraunces, Georgia, serif; font-size: 26px; margin: 0; color: var(--maroon); }
  .sub { color: var(--muted); font-size: 13px; margin-top: 4px; }
  .doc-kind { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
  .meta { display: flex; flex-wrap: wrap; gap: 6px 28px; font-size: 12px; color: var(--muted); margin-bottom: 22px; }
  .meta b { color: var(--ink); font-weight: 600; }
  .block { border: 1px solid #ececec; border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
  .block-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 9px 14px; border-bottom: 1px solid; }
  .block-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13.5px; }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
  .count { background: rgba(255,255,255,.7); border-radius: 999px; padding: 1px 9px; font-size: 11px; font-weight: 700; }
  .scope { background: var(--maroon); color: #fff; border-radius: 999px; padding: 2px 9px; font-size: 10.5px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 14px; border-top: 1px solid #f1efe8; vertical-align: top; font-size: 12.5px; }
  tr:first-child td { border-top: 0; }
  td.num { width: 30px; color: #b4b2a9; font-variant-numeric: tabular-nums; }
  .where { font-weight: 600; }
  .item { color: #57564f; }
  .remark { font-style: italic; color: var(--muted); margin-top: 2px; }
  td.stamp { width: 180px; text-align: right; color: #9a988f; font-size: 11px; white-space: nowrap; }
  .immediate { border-color: #f0b9b6; }
  .empty { text-align: center; color: var(--muted); padding: 36px; border: 1px dashed #ddd; border-radius: 12px; }
  .final { margin-top: 28px; border-top: 2px solid #ececec; padding-top: 18px; }
  .final-title { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
  .final-note { font-size: 12.5px; color: #27500a; }
  .final-note.muted { color: var(--muted); }
  .sigs { display: flex; gap: 40px; margin-top: 26px; }
  .sig { flex: 1; }
  .sig-label { font-size: 11px; color: var(--muted); margin-bottom: 22px; }
  .sig-line { border-bottom: 1px solid #888; height: 0; margin-bottom: 4px; }
  .sig-name { font-weight: 600; border-bottom: 1px solid #888; padding-bottom: 3px; }
  .sig-desig { font-size: 11px; color: var(--muted); margin-top: 3px; }
  footer { margin-top: 34px; font-size: 10.5px; color: #b4b2a9; text-align: center; }
  @media print {
    body { background: #fff; }
    .sheet { padding: 0; max-width: none; }
    .toolbar { display: none; }
    .block, .final { break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="toolbar"><button onclick="window.print()">Save as PDF / Print</button></div>
  <div class="sheet">
    <header>
      <h1>${esc(title)}</h1>
      ${subParts ? `<div class="sub">${subParts}</div>` : ''}
      <div class="doc-kind">Visit Sign-Off Sheet · Official Record</div>
    </header>
    <div class="meta">
      <div><b>Generated:</b> ${esc(generatedAt)}</div>
      <div><b>Date range:</b> ${esc(filterSummary?.dateLabel || 'All dates')}</div>
      <div><b>User:</b> ${esc(filterSummary?.userLabel || 'All users')}</div>
      <div><b>Items:</b> ${totalItems}</div>
    </div>
    ${immediateHtml}
    ${sections}
    ${emptyHtml}
    ${finalBlock}
    <footer>Centre Point Group · Generated ${esc(generatedAt)}</footer>
  </div>
  <script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 250); });</script>
</body>
</html>`;
}

// Opens the report in a new window and triggers the print dialog. If a popup
// blocker prevents the window, falls back to downloading the HTML file.
export function downloadSignoffReport(opts) {
  const html = buildSignoffReportHtml(opts);
  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    return;
  }
  // Popup blocked — download a standalone HTML file the user can open + print.
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const name = (opts.handover?.name || 'sign-off').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  a.href = url;
  a.download = `${name}-report.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
