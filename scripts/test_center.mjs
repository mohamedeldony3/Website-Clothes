import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\temp\\chrome_center_test_' + Date.now();
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9234',
  '--user-data-dir=' + USER_DATA_DIR,
  'about:blank'
], { stdio: 'ignore' });

async function run() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9234/json/version');
      if (res.ok) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  const newTarget = await (await fetch('http://127.0.0.1:9234/json/new?http://localhost:3000', { method: 'PUT' })).json();
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

        const width = 800;
        const height = 800;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#0c0c0c');

        // Camera facing FRONT
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(0, 0, 4.0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setSize(width, height);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        scene.add(new THREE.AmbientLight(0xffffff, 1.2));
        const key = new THREE.DirectionalLight(0xffffff, 2.5);
        key.position.set(2, 4, 3);
        scene.add(key);

        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);
        loader.load('/models/pullover_hoodie.glb', (gltf) => {
          const root = gltf.scene;

          // Center each mesh geometry directly
          let maxDim = 0;
          root.traverse(c => {
            if (c.isMesh) {
              c.geometry.center();
              c.geometry.computeBoundingBox();
              const size = new THREE.Vector3();
              c.geometry.boundingBox.getSize(size);
              maxDim = Math.max(size.x, size.y, size.z);
              c.material = new THREE.MeshStandardMaterial({
                color: '#f0f0ee',
                roughness: 0.88,
                metalness: 0.02
              });
            }
          });

          const scale = 2.45 / maxDim;
          root.scale.setScalar(scale);
          root.position.set(0, 0, 0);

          scene.add(root);
          renderer.render(scene, camera);

          const dataUrl = renderer.domElement.toDataURL('image/png');
          resolve({ success: true, dataUrl, scale, maxDim });
        });
      })
    `
  });

  if (result.result.value?.dataUrl) {
    const base64 = result.result.value.dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('public/proof-centered-front.png', Buffer.from(base64, 'base64'));
    console.log('Saved public/proof-centered-front.png! Scale:', result.result.value.scale);
  } else {
    console.log('Failed:', result.result.value);
  }

  ws.close();
  chrome.kill();
  try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (e) {}
}
run();
