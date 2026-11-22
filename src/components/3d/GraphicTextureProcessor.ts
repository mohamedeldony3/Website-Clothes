import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();

export function getProductGraphicTexture(
  imageUrl: string,
  onLoaded?: (texture: THREE.CanvasTexture) => void
): THREE.CanvasTexture | null {
  if (textureCache.has(imageUrl)) {
    const cached = textureCache.get(imageUrl)!;
    if (onLoaded) onLoaded(cached);
    return cached;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = imageUrl;

  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Crop coordinates focused on the back graphic region of the hoodie
      // (Graphics in the product photos are located between 32% and 80% vertically, and 20% to 80% horizontally)
      const sx = img.naturalWidth * 0.18;
      const sy = img.naturalHeight * 0.32;
      const sw = img.naturalWidth * 0.64;
      const sh = img.naturalHeight * 0.48;

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 512, 512);

      const imgData = ctx.getImageData(0, 0, 512, 512);
      const data = imgData.data;

      // Sample base fabric color from the 4 corners of the cropped graphic area
      const cornerSamples = [
        [0, 0],
        [511, 0],
        [0, 511],
        [511, 511],
        [10, 10],
        [500, 10],
      ];

      let avgR = 0, avgG = 0, avgB = 0;
      for (const [cx, cy] of cornerSamples) {
        const idx = (cy * 512 + cx) * 4;
        avgR += data[idx];
        avgG += data[idx + 1];
        avgB += data[idx + 2];
      }
      avgR /= cornerSamples.length;
      avgG /= cornerSamples.length;
      avgB /= cornerSamples.length;

      // Color distance keying: make pixels matching the hoodie fabric background transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean color distance in RGB
        const dist = Math.sqrt(
          (r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2
        );

        // Soft threshold alpha transition
        if (dist < 28) {
          data[i + 3] = 0; // Completely transparent fabric background
        } else if (dist < 55) {
          // Antialiased edge
          data[i + 3] = Math.floor(((dist - 28) / 27) * 255);
        }
      }

      ctx.putImageData(imgData, 0, 0);

      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.needsUpdate = true;

      textureCache.set(imageUrl, texture);
      if (onLoaded) onLoaded(texture);
    } catch (e) {
      console.warn('Could not process graphic texture:', e);
    }
  };

  return null;
}
