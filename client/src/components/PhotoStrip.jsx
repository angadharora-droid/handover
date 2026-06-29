import { useRef, useState } from 'react';
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

const ADD_BTN =
  'flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed ' +
  'border-stone-300 text-[10px] font-medium text-stone-500 transition hover:border-maroon hover:text-maroon ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

// Optional photo evidence for a checklist item: take a live photo (camera) or
// pick from the gallery. Both are optional and only shown when editable.
export default function PhotoStrip({ area, room, itemId, photos = [], disabled }) {
  const upload = useUploadPhoto();
  const del = useDeletePhoto();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);

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

  const removePhoto = (id) => {
    if (!confirm('Remove this photo?')) return;
    del.mutate(id);
  };

  // Nothing to show: no photos and the item is read-only.
  if (disabled && photos.length === 0) return null;

  return (
    <div className="mt-1">
      <div className="flex flex-wrap items-center gap-2">
        {photos.map((p) => (
          <div key={p.id} className="group relative">
            <button
              type="button"
              onClick={() => setViewing(p.id)}
              className="block h-14 w-14 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 transition hover:ring-2 hover:ring-maroon/30"
              title={[p.uploadedByName, formatDateTime(p.createdAt)].filter(Boolean).join(' · ') || 'View photo'}
            >
              <img src={p.thumb} alt="Item photo" className="h-full w-full object-cover" />
            </button>
            {!disabled && (
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
                aria-label="Remove photo"
                className="absolute -right-1.5 -top-1.5 rounded-full bg-maroon p-1 text-white shadow opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {!disabled && (
          <>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={busy}
              className={ADD_BTN}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              Camera
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={busy}
              className={ADD_BTN}
            >
              <ImagePlus className="h-4 w-4" />
              Upload
            </button>
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
          </>
        )}
      </div>

      {error && <div className="mt-1 text-[10px] font-medium text-maroon">{error}</div>}

      {viewing && <Lightbox id={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
