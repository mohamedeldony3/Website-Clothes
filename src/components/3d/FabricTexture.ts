import * as THREE from 'three';

let cachedFabricTexture: THREE.CanvasTexture | null = null;

export function getProceduralFabricTexture(): THREE.CanvasTexture {
  if (cachedFabricTexture) return cachedFabricTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Base fabric tone
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    // Diagonal heavy loopback weave pattern
    ctx.lineWidth = 1.2;
    for (let x = 0; x < 512; x += 4) {
      for (let y = 0; y < 512; y += 4) {
        const noise = (Math.random() - 0.5) * 35;
        const val = Math.floor(128 + noise);
        ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        ctx.fillRect(x, y, 2, 2);

        // Weave cross hatch
        if ((x + y) % 8 === 0) {
          ctx.fillStyle = '#656565';
          ctx.fillRect(x, y, 3, 1.5);
        } else if ((x - y) % 8 === 0) {
          ctx.fillStyle = '#9c9c9c';
          ctx.fillRect(x, y, 1.5, 3);
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  cachedFabricTexture = texture;
  return texture;
}
