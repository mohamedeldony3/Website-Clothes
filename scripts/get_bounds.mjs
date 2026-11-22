import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\temp\\chrome_decal_pos_' + Date.now();
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9229',
  '--user-data-dir=' + USER_DATA_DIR,
  '--use-gl=angle',
  '--use-angle=d3d11',
  '--enable-webgl',
  'about:blank'
], { stdio: 'ignore' });

async function run() {
  await new Promise(r => setTimeout(r, 1000));
  const newTarget = await (await fetch('http://127.0.0.1:9229/json/new?http://localhost:3000', { method: 'PUT' })).json();
  const ws = new WebSocket(newTarget.webSocketDebuggerUrl);
  let id = 1;
  const callbacks = new Map();
  function send(method, params = {}) {
    return new Promise(res => {
      const msgId = id++;
      callbacks.set(msgId, res);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }
  await new Promise(r => ws.onopen = r);
  ws.onmessage = (e) => {
    const d = JSON.parse(e.data);
    if (d.id && callbacks.has(d.id)) {
      callbacks.get(d.id)(d.result);
      callbacks.delete(d.id);
    }
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await new Promise(r => setTimeout(r, 2000));

  const result = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `
      new Promise(async (resolve) => {
        const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
        const THREE = await import('/node_modules/three/build/three.module.js');
        const loader = new GLTFLoader();
        loader.load('/models/hoodie.glb', (gltf) => {
          let minZ = Infinity;
          let maxZ = -Infinity;
          let minY = Infinity;
          let maxY = -Infinity;
          gltf.scene.traverse(c => {
            if (c.isMesh) {
              const pos = c.geometry.attributes.position;
              for (let i = 0; i < pos.count; i++) {
                const z = pos.getZ(i);
                const y = pos.getY(i);
                if (z < minZ) minZ = z;
                if (z > maxZ) maxZ = z;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          });
          resolve({ minZ, maxZ, minY, maxY });
        });
      })
    `
  });
  console.log('Model Bounds:', result.result.value);
  ws.close();
  chrome.kill();
  try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (e) {}
}
run();
