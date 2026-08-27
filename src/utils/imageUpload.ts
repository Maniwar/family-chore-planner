/**
 * Image compression & data URL helper for local avatar and house picture uploads.
 * Automatically scales down large mobile photos (to max 600px) and compresses to WebP/JPEG
 * so they save neatly into localStorage without exceeding quota limits.
 */

export interface ProcessedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  originalFileName: string;
}

export function processImageFile(
  file: File,
  maxDimension = 500,
  quality = 0.82
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate scaled down dimensions preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to create canvas context'));
          return;
        }

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first for high compression, fallback to jpeg
        let dataUrl: string;
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve({
          dataUrl,
          width,
          height,
          originalFileName: file.name,
        });
      };

      img.onerror = () => reject(new Error('Failed to load and process image.'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
    reader.readAsDataURL(file);
  });
}
