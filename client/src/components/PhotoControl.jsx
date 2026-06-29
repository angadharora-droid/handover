import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, X, Trash2, Loader2 } from 'lucide-react';
import { useUploadPhoto, useDeletePhoto, usePhotoFull } from '../lib/queries';
import { compressImage } from '../lib/image';
import { formatDateTime } from '../lib/format';
import { apiError } from '../lib/api';

// Full-screen viewer for a single photo. The full image bytes are fetched
// lazily (the list only ships thumbnails).
function Lightbox({ id, onClose }) {
  const { data, isLoading, error } = usePhotoFull(id);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/25"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading photo…
          </div>
        )}
        {error && <div className="text-sm text-white/80">Could not load this photo.</div>}
        {data && (
          <figure className="text-center">
            <img src={data.data} alt="Item photo" className="max-h-[80vh] w-auto rounded-lg shadow-2xl" />
            <figcaption className="mt-2 text-xs text-white/70">
              {[data.uploadedByName, formatDateTime(data.createdAt)].filter(Boolean).join(' · ')}
            </figcaption>
          </figure>
        )}
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
          {photos.map((p) => (
            <div key={p.id} className="group relative">
              <button
                type="button"
                onClick={() => setViewing(p.id)}
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

      {viewing && <Lightbox id={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
