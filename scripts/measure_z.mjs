import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\temp\\chrome_measure_z_' + Date.now();
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9236',
  '--user-data-dir=' + USER_DATA_DIR,
  'about:blank'
], { stdio: 'ignore' });

async function run() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9236/json/version');
      if (res.ok) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  const newTarget = await (await fetch('http://127.0.0.1:9236/json/new?http://localhost:3000', { method: 'PUT' })).json();
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
        const { MeshoptDecoder } = await import('/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js');
        const THREE = await import('/node_modules/three/build/three.module.js');

        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);
        loader.load('/models/pullover_hoodie.glb', (gltf) => {
          const cloned = gltf.scene.clone(true);
          const box = new THREE.Box3().setFromObject(cloned);
          const center = new THREE.Vector3();
          const size = new THREE.Vector3();
          box.getCenter(center);
          box.getSize(size);

          cloned.position.set(-center.x, -center.y, -center.z);
          const maxDim = Math.max(size.x, size.y, size.z);
          const s = 2.45 / maxDim;
          const wrap = new THREE.Group();
          wrap.scale.setScalar(s);
          wrap.add(cloned);
          wrap.updateMatrixWorld(true);

          let frontZ = [];
          let backZ = [];
          wrap.traverse(c => {
            if (c.isMesh) {
              const pos = c.geometry.attributes.position;
              const v = new THREE.Vector3();
              for (let i = 0; i < pos.count; i++) {
                v.fromBufferAttribute(pos, i);
                v.applyMatrix4(c.matrixWorld);
                if (Math.abs(v.x) < 0.25 && v.y > -0.1 && v.y < 0.35) {
                  if (v.z < 0) backZ.push(v.z);
                  else frontZ.push(v.z);
                }
              }
            }
          });

          // Sort backZ to find the outermost surface
          backZ.sort((a,b) => a - b);
          // min is outermost (most negative), max is innermost
          resolve({
            outermostBackZ: backZ[0],
            medianBackZ: backZ[Math.floor(backZ.length / 2)],
            innermostBackZ: backZ[backZ.length - 1],
            sampleCount: backZ.length
          });
        });
      })
    `
  });

  console.log('Back Z Analysis:', result.result.value);
  ws.close();
  chrome.kill();
  try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (e) {}
}
run();
