import { useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useSaveEntry, useAddCustomItem, useDeleteCustomItem, usePhotos } from '../lib/queries';
import { staticItems, getEntry, ADMIN_ONLY_STATUSES } from '../lib/checklist';
import { STATUS_BADGE, STATUS_LABEL } from '../lib/statusStyles';
import { formatDateTime } from '../lib/format';
import { apiError } from '../lib/api';
import PhotoStrip from './PhotoStrip';

function ItemRow({ item, entry, statusOptions, disabled, isAdmin, area, room, photos, onSave, onDelete }) {
  const [status, setStatus] = useState(entry.status || '');
  const [remarks, setRemarks] = useState(entry.remarks || '');
  const [meta, setMeta] = useState({ updatedAt: entry.updatedAt, by: entry.updatedByName });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const lastSaved = useRef({ status: entry.status || '', remarks: entry.remarks || '' });

  const persist = async (next) => {
    setSaving(true);
    setError('');
    try {
      const saved = await onSave({ itemId: item.id, ...next });
      lastSaved.current = { status: next.status, remarks: next.remarks };
      setMeta({ updatedAt: saved.updatedAt, by: saved.updatedByName });
    } catch (err) {
      setStatus(lastSaved.current.status);
      setRemarks(lastSaved.current.remarks);
      setError(apiError(err, 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const onStatusChange = (e) => {
    const val = e.target.value;
    setStatus(val);
    persist({ status: val, remarks });
  };

  const onRemarksBlur = () => {
    if (remarks === lastSaved.current.remarks) return;
    persist({ status, remarks });
  };

  const badge = STATUS_BADGE[status] || STATUS_BADGE[''];

  return (
    <div className="-mx-2 grid gap-3 rounded-lg border-b border-stone-100 px-2 py-3 transition last:border-b-0 hover:bg-stone-50/70 sm:grid-cols-[1fr_13rem_1.1fr]">
      {/* Item info */}
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          {item.isCustom ? (
            <span className="badge shrink-0 bg-amber-100 text-[9px] uppercase tracking-wide text-amber-700">
              Other
            </span>
          ) : (
            <span className="shrink-0 font-mono text-[11px] text-stone-400">{item.id}</span>
          )}
          <span className="text-sm font-medium text-ink">{item.name}</span>
          {item.isCustom && !disabled && (
            <button
              onClick={onDelete}
              title="Remove item"
              aria-label="Remove item"
              className="ml-1 shrink-0 rounded p-0.5 text-stone-300 transition hover:bg-maroon-light hover:text-maroon"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {item.spec && <div className="mt-0.5 text-xs leading-relaxed text-stone-500">{item.spec}</div>}
        {meta.updatedAt && (
          <div className="mt-1 text-[10px] text-stone-400">
            {saving ? 'Saving…' : `Updated ${formatDateTime(meta.updatedAt)}`}
            {meta.by && !saving ? ` · ${meta.by}` : ''}
          </div>
        )}
        {error && <div className="mt-1 text-[10px] font-medium text-maroon">{error}</div>}
      </div>

      {/* Status */}
      <div>
        <span className="badge mb-1.5" style={{ background: badge.bg, color: badge.text }}>
          {STATUS_LABEL[status]}
        </span>
        <select className="field py-1.5" value={status} disabled={disabled} onChange={onStatusChange}>
          {statusOptions.map((o) => {
            const adminOnly = ADMIN_ONLY_STATUSES.includes(o.val);
            return (
              <option key={o.val} value={o.val} disabled={adminOnly && !isAdmin}>
                {o.label}
                {adminOnly && !isAdmin ? ' (admin only)' : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* Remarks */}
      <div>
        <textarea
          className="field min-h-[44px] resize-y py-1.5 leading-snug"
          placeholder="Add remarks…"
          value={remarks}
          disabled={disabled}
          onChange={(e) => setRemarks(e.target.value)}
          onBlur={onRemarksBlur}
        />
      </div>

      {/* Photos (optional) — spans the full row width. Hidden entirely when the
          row is read-only and carries no photos, so it adds no empty gap. */}
      {(!disabled || photos.length > 0) && (
        <div className="sm:col-span-full">
          <PhotoStrip area={area} room={room} itemId={item.id} photos={photos} disabled={disabled} />
        </div>
      )}
    </div>
  );
}

function AddItemRow({ area, room }) {
  const add = useAddCustomItem();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!name.trim()) return;
    setError('');
    try {
      await add.mutateAsync({ area, room: room || null, name: name.trim() });
      setName('');
    } catch (err) {
      setError(apiError(err, 'Could not add item'));
    }
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-stone-200 pt-4">
      <input
        className="field max-w-md flex-1"
        placeholder="Add another item (Other)…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
      />
      <button onClick={submit} disabled={add.isPending || !name.trim()} className="btn btn-outline btn-sm">
        <Plus className="h-4 w-4" /> Add item
      </button>
      {error && <span className="text-xs text-maroon">{error}</span>}
    </div>
  );
}

export default function ChecklistTable({
  checklist,
  area,
  room,
  entriesMap,
  statusOptions,
  disabled,
  isAdmin,
  customItems = [],
}) {
  const saveEntry = useSaveEntry();
  const deleteItem = useDeleteCustomItem();
  const { data: photos } = usePhotos(area, room);

  const onSave = ({ itemId, status, remarks }) =>
    saveEntry.mutateAsync({ area, room: room || null, itemId, status, remarks });

  const items = [...staticItems(checklist, area), ...customItems];

  // Group this area/room's photos by the item they belong to.
  const photosByItem = {};
  (photos || []).forEach((p) => {
    (photosByItem[p.itemId] ||= []).push(p);
  });

  return (
    <div>
      <div className="hidden grid-cols-[1fr_13rem_1.1fr] gap-3 border-b-2 border-stone-200 pb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400 sm:grid">
        <div>Item</div>
        <div>Status</div>
        <div>Remarks</div>
      </div>

      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          entry={getEntry(entriesMap, area, room || null, item.id)}
          statusOptions={statusOptions}
          disabled={disabled}
          isAdmin={isAdmin}
          area={area}
          room={room}
          photos={photosByItem[item.id] || []}
          onSave={onSave}
          onDelete={
            item.isCustom
              ? () => {
                  if (confirm(`Remove “${item.name}”?`)) deleteItem.mutate(item.id);
                }
              : undefined
          }
        />
      ))}

      {!disabled && <AddItemRow area={area} room={room} />}
    </div>
  );
}
