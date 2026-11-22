import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\temp\\chrome_hoodie_proof_' + Date.now();
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9230',
  '--user-data-dir=' + USER_DATA_DIR,
  '--use-gl=angle',
  '--use-angle=d3d11',
  '--enable-webgl',
  '--ignore-gpu-blocklist',
  'about:blank'
], { stdio: 'ignore' });

async function run() {
  await new Promise(r => setTimeout(r, 1200));
  const newTarget = await (await fetch('http://127.0.0.1:9230/json/new?http://localhost:3000', { method: 'PUT' })).json();
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
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to http://localhost:3000 ...');
  await send('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise(r => setTimeout(r, 4000));

  // 1. Scroll to Fitting Lab and select Tokyo Wave (White)
  console.log('Scrolling to Fitting Lab and selecting Tokyo Wave (white)...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const lab = document.getElementById('fitting-lab') || document.querySelector('section:has(canvas)');
        if (lab) lab.scrollIntoView({ behavior: 'instant' });

        // Find Tokyo Wave button
        const tokyoBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('TOKYO') || b.textContent.includes('طوكيو')));
        if (tokyoBtn) tokyoBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2500));

  // Capture Front View of White Pullover Hoodie
  const labFrontShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-real-pullover-white-front.png', Buffer.from(labFrontShot.data, 'base64'));
  console.log('Saved public/proof-real-pullover-white-front.png');

  // Flip to Back View (180°)
  console.log('Flipping to Back View (180°)...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('VIEW BACK'));
        if (btn) btn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2500));

  // Capture Back View of White Pullover Hoodie
  const labBackShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-real-pullover-white-back.png', Buffer.from(labBackShot.data, 'base64'));
  console.log('Saved public/proof-real-pullover-white-back.png');

  ws.close();
  chrome.kill();
  try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (e) {}
  console.log('Verification Complete!');
}
run();
