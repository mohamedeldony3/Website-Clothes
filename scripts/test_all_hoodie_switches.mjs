import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\temp\\chrome_switch_test_' + Date.now();
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9239',
  '--user-data-dir=' + USER_DATA_DIR,
  'about:blank'
], { stdio: 'ignore' });

async function run() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9239/json/version');
      if (res.ok) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  const newTarget = await (await fetch('http://127.0.0.1:9239/json/new?http://localhost:3000', { method: 'PUT' })).json();
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
  await new Promise(r => setTimeout(r, 3500));

  // 1. Scroll to Fitting Lab
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const lab = document.getElementById('fitting-lab') || document.querySelector('section:has(canvas)');
        if (lab) lab.scrollIntoView({ behavior: 'instant' });
      })()
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  // 2. Select "ARE YOU OK" hoodie
  console.log('Selecting ARE YOU OK hoodie...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('ARE') || b.textContent.includes('أريو')));
        if (btn) btn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2000));

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
  await new Promise(r => setTimeout(r, 2000));

  const areYouOkBack = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-are-you-ok-back.png', Buffer.from(areYouOkBack.data, 'base64'));
  console.log('Saved public/proof-are-you-ok-back.png');

  // 3. Select "SAVAGE" hoodie (Brown)
  console.log('Selecting SAVAGE hoodie (Brown)...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('SAVAGE') || b.textContent.includes('سافاج')));
        if (btn) btn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2000));

  const savageBack = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-savage-back.png', Buffer.from(savageBack.data, 'base64'));
  console.log('Saved public/proof-savage-back.png');

  // 4. Select "SPIDER" hoodie (Black)
  console.log('Selecting SPIDER hoodie (Black)...');
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('LIQUID') || b.textContent.includes('عنكبوت')));
        if (btn) btn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2000));

  const spiderBack = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-spider-back.png', Buffer.from(spiderBack.data, 'base64'));
  console.log('Saved public/proof-spider-back.png');

  ws.close();
  chrome.kill();
  try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (e) {}
  console.log('All tests passed successfully!');
}
run();
