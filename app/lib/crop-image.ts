/**
 * Get cropped image as base64 from source image and crop region.
 * Used with react-image-crop for flag/image upload.
 */

import type { Crop } from 'react-image-crop';

export async function getCroppedImg(
  crop: Crop,
  imageElement: HTMLImageElement
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = imageElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas 2d context not available'));
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const cropX = crop.unit === '%' ? (crop.x / 100) * image.naturalWidth : crop.x * scaleX;
    const cropY = crop.unit === '%' ? (crop.y / 100) * image.naturalHeight : crop.y * scaleY;
    const cropW = crop.unit === '%' ? (crop.width / 100) * image.naturalWidth : crop.width * scaleX;
    const cropH = crop.unit === '%' ? (crop.height / 100) * image.naturalHeight : crop.height * scaleY;

    canvas.width = Math.round(cropW);
    canvas.height = Math.round(cropH);

    ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob failed'));
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsDataURL(blob);
      },
      'image/png',
      0.95
    );
  });
}
