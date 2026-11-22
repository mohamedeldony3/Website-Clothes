import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\temp\\chrome_glb_test_' + Date.now();
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9227',
  '--user-data-dir=' + USER_DATA_DIR,
  '--use-gl=angle',
  '--use-angle=d3d11',
  '--enable-webgl',
  'about:blank'
], { stdio: 'ignore' });

async function run() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9227/json/version');
      if (res.ok) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  const newTarget = await (await fetch('http://127.0.0.1:9227/json/new?http://localhost:3000', { method: 'PUT' })).json();
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
  await new Promise(r => setTimeout(r, 2500));

  const result = await send('Runtime.evaluate', {
    awaitPromise: true,
    returnByValue: true,
    expression: `
      new Promise(async (resolve, reject) => {
        try {
          const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
          const { MeshoptDecoder } = await import('/node_modules/three/examples/jsm/libs/meshopt_decoder.module.js');
          const THREE = await import('/node_modules/three/build/three.module.js');
          const loader = new GLTFLoader();
          loader.setMeshoptDecoder(MeshoptDecoder);
          loader.load('/models/pullover_hoodie.glb', (gltf) => {
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            let meshes = [];
            gltf.scene.traverse(c => {
              if (c.isMesh) meshes.push(c.name + ' (verts: ' + c.geometry.attributes.position.count + ')');
            });
            resolve({
              success: true,
              size: { x: size.x, y: size.y, z: size.z },
              center: { x: center.x, y: center.y, z: center.z },
              meshes: meshes
            });
          }, undefined, (err) => {
            resolve({ success: false, error: err.message || err.toString() });
          });
        } catch(e) {
          resolve({ success: false, error: e.message });
        }
      })
    `
  });
  console.log('Browser GLTF Loader Result:\n', JSON.stringify(result.result.value, null, 2));
  ws.close();
  chrome.kill();
  try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (e) {}
}
run();
