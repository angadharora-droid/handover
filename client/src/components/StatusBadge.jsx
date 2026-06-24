import { STATUS_BADGE, STATUS_LABEL } from '../lib/statusStyles';

export default function StatusBadge({ status }) {
  const s = status || '';
  const c = STATUS_BADGE[s] || STATUS_BADGE[''];
  return (
    <span className="badge" style={{ background: c.bg, color: c.text }}>
      {STATUS_LABEL[s]}
    </span>
  );
}
