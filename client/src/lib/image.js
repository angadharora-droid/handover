// Resize + compress an image File entirely in the browser before upload, so we
// never ship a multi-megabyte phone photo to the server. Returns two JPEG data
// URLs: `full` (capped at maxDim, for the lightbox) and `thumb` (small, for the
// inline strip). Aspect ratio is preserved.

function drawToDataUrl(img, maxDim, quality) {
  let { width, height } = img;
  if (width > height) {
    if (width > maxDim) {
      height = Math.round((height * maxDim) / width);
      width = maxDim;
    }
  } else if (height > maxDim) {
    width = Math.round((width * maxDim) / height);
    height = maxDim;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

export function compressImage(
  file,
  { maxDim = 1280, quality = 0.7, thumbDim = 320, thumbQuality = 0.55 } = {}
) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('That file is not an image'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        resolve({
          full: drawToDataUrl(img, maxDim, quality),
          thumb: drawToDataUrl(img, thumbDim, thumbQuality),
        });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image'));
    };
    img.src = url;
  });
}
