import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Camera, ImagePlus, X, Trash2, Loader2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useUploadPhoto, useDeletePhoto, usePhotoFull, photoFullQuery } from '../lib/queries';
import { compressImage } from '../lib/image';
import { formatDateTime } from '../lib/format';
import { apiError } from '../lib/api';

// Full-screen viewer for an item's photos. Opens on the clicked thumbnail and
// lets you page through the rest (arrows, ←/→ keys). Full image bytes are
// fetched lazily — the list only ships thumbnails — and neighbours are
// prefetched so paging feels instant.
function Lightbox({ photos, index, onClose }) {
  const [i, setI] = useState(index);
  const qc = useQueryClient();
  const count = photos.length;
  const hasNav = count > 1;
  const photo = photos[i];
  const { data, isLoading, error } = usePhotoFull(photo?.id);

  const go = useCallback((delta) => setI((cur) => (cur + delta + count) % count), [count]);
  const stop = (e) => e.stopPropagation();

  // Esc to close, ←/→ to page, and lock background scroll while open.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && hasNav) go(-1);
      else if (e.key === 'ArrowRight' && hasNav) go(1);
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, go, hasNav]);

  // Warm the cache for the photos either side of the current one.
  useEffect(() => {
    if (!hasNav) return;
    for (const n of [i - 1, i + 1]) {
      const neighbour = photos[(n + count) % count];
      if (neighbour) qc.prefetchQuery(photoFullQuery(neighbour.id));
    }
  }, [i, hasNav, count, photos, qc]);

  const caption = [data?.uploadedByName, data && formatDateTime(data.createdAt)]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      {/* Top bar: position counter + download / close. */}
      <div className="flex items-center justify-between gap-3 px-4 py-3" onClick={stop}>
        <span className="text-xs font-medium tabular-nums text-white/60">
          {hasNav ? `${i + 1} / ${count}` : 'Photo'}
        </span>
        <div className="flex items-center gap-1.5">
          {data?.data && (
            <a
              href={data.data}
              download={`photo-${photo.id}.jpg`}
              aria-label="Download photo"
              title="Download"
              className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/25"
            >
              <Download className="h-5 w-5" />
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Stage: image scales to fit; clicking the letterbox margins closes. */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4">
        {hasNav && (
          <button
            type="button"
            onClick={(e) => { stop(e); go(-1); }}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/25 sm:left-4"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-white/80" onClick={stop}>
            <Loader2 className="h-5 w-5 animate-spin" /> Loading photo…
          </div>
        )}
        {error && !isLoading && (
          <div className="text-sm text-white/80" onClick={stop}>Could not load this photo.</div>
        )}
        {data?.data && (
          <img
            key={photo.id}
            src={data.data}
            alt="Item photo"
            onClick={stop}
            className="max-h-full max-w-full animate-fade-in rounded-lg object-contain shadow-2xl"
          />
        )}

        {hasNav && (
          <button
            type="button"
            onClick={(e) => { stop(e); go(1); }}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/25 sm:right-4"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Caption: uploader + timestamp. */}
      <div className="min-h-[1.25rem] px-4 py-3 text-center text-xs text-white/70" onClick={stop}>
        {caption}
      </div>
    </div>
  );
}

// Optional photo evidence for a checklist item. A single icon sits to the right
// of the remarks; clicking it offers a choice of taking a live photo (camera)
// or picking from the gallery. Thumbnails of attached photos sit beneath it.
export default function PhotoControl({ area, room, itemId, photos = [], disabled }) {
  const upload = useUploadPhoto();
  const del = useDeletePhoto();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const rootRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState(null);

  // Close the chooser on an outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleFiles = async (fileList, inputRef) => {
    const files = Array.from(fileList || []).filter((f) => f.type?.startsWith('image/'));
    if (inputRef?.current) inputRef.current.value = ''; // allow re-picking the same file
    if (!files.length) return;

    setBusy(true);
    setError('');
    try {
      for (const file of files) {
        const { full, thumb } = await compressImage(file);
        await upload.mutateAsync({ area, room: room || null, itemId, data: full, thumb });
      }
    } catch (err) {
      setError(apiError(err, 'Could not add photo'));
    } finally {
      setBusy(false);
    }
  };

  const choose = (inputRef) => {
    setOpen(false);
    inputRef.current?.click();
  };

  const removePhoto = (id) => {
    if (!confirm('Remove this photo?')) return;
    del.mutate(id);
  };

  // Nothing to show: no photos and the item is read-only.
  if (disabled && photos.length === 0) return null;

  return (
    <div ref={rootRef} className="flex flex-col items-start gap-2 sm:items-end">
      {!disabled && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            disabled={busy}
            aria-label="Add photo"
            aria-haspopup="menu"
            aria-expanded={open}
            title="Add photo"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 text-stone-500 transition hover:border-maroon hover:text-maroon disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => choose(cameraRef)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink transition hover:bg-stone-50"
              >
                <Camera className="h-4 w-4 text-stone-500" /> Take photo
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => choose(galleryRef)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink transition hover:bg-stone-50"
              >
                <ImagePlus className="h-4 w-4 text-stone-500" /> Upload from gallery
              </button>
            </div>
          )}

          {/* `capture` opens the rear camera on mobile; the second input (no
              capture, multiple) opens the gallery / file picker. */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files, cameraRef)}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files, galleryRef)}
          />
        </div>
      )}

      {photos.length > 0 && (
        <div className="flex max-w-[8rem] flex-wrap gap-1.5 sm:justify-end">
          {photos.map((p, i) => (
            <div key={p.id} className="group relative">
              <button
                type="button"
                onClick={() => setViewing(i)}
                className="block h-9 w-9 overflow-hidden rounded-md border border-stone-200 bg-stone-50 transition hover:ring-2 hover:ring-maroon/30"
                title={[p.uploadedByName, formatDateTime(p.createdAt)].filter(Boolean).join(' · ') || 'View photo'}
              >
                <img src={p.thumb} alt="Item photo" className="h-full w-full object-cover" />
              </button>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label="Remove photo"
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-maroon p-0.5 text-white shadow opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <div className="text-[10px] font-medium text-maroon">{error}</div>}

      {viewing !== null && (
        <Lightbox photos={photos} index={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
