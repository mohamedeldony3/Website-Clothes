import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\temp\\chrome_solid_test_' + Date.now();
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9237',
  '--user-data-dir=' + USER_DATA_DIR,
  'about:blank'
], { stdio: 'ignore' });

async function run() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9237/json/version');
      if (res.ok) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  const newTarget = await (await fetch('http://127.0.0.1:9237/json/new?http://localhost:3000', { method: 'PUT' })).json();
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

        // Angled side/back camera (looking at side profile like user screenshot)
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
        camera.position.set(-2.8, 0.3, -2.8);
        camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        renderer.setSize(width, height);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.outputColorSpace = THREE.SRGBColorSpace;

        scene.add(new THREE.AmbientLight(0xffffff, 1.0));
        const key = new THREE.DirectionalLight(0xffffff, 2.5);
        key.position.set(-2, 4, -3);
        scene.add(key);

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

          wrap.traverse(c => {
            if (c.isMesh) {
              c.material = new THREE.MeshStandardMaterial({
                color: '#f0f0ee',
                roughness: 0.88,
                metalness: 0.02,
                side: THREE.DoubleSide,
                transparent: false,
                opacity: 1.0,
                depthWrite: true,
                depthTest: true
              });
            }
          });

          // Are You Ok Decal placed tight against the cloth at z = -0.375
          const texLoader = new THREE.TextureLoader();
          texLoader.load('/graphics/are-you-ok.png', (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            const decalGeo = new THREE.PlaneGeometry(0.85, 0.85);
            const decalMat = new THREE.MeshStandardMaterial({
              map: tex,
              transparent: true,
              alphaTest: 0.02,
              roughness: 0.55,
              metalness: 0.05,
              side: THREE.FrontSide, // FrontSide only so it never leaks through to the front
              depthWrite: false,
              polygonOffset: true,
              polygonOffsetFactor: -4
            });
            const decalMesh = new THREE.Mesh(decalGeo, decalMat);
            decalMesh.position.set(0, 0.05, -0.375);
            decalMesh.rotation.set(0, Math.PI, 0);

            scene.add(wrap);
            scene.add(decalMesh);

            renderer.render(scene, camera);
            const dataUrl = renderer.domElement.toDataURL('image/png');
            resolve({ success: true, dataUrl });
          });
        });
      })
    `
  });

  if (result.result.value?.dataUrl) {
    const base64 = result.result.value.dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync('public/proof-are-you-ok-side.png', Buffer.from(base64, 'base64'));
    console.log('Saved public/proof-are-you-ok-side.png!');
  } else {
    console.log('Failed:', result.result.value);
  }

  ws.close();
  chrome.kill();
  try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (e) {}
}
run();
