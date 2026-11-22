import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\temp\\chrome_qa_' + Date.now();
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9222',
  `--user-data-dir=${USER_DATA_DIR}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
], { stdio: 'ignore' });

async function waitForCDP() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) return await res.json();
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('CDP not responding on 9222');
}

async function run() {
  try {
    await waitForCDP();
    const newTargetRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000', { method: 'PUT' });
    const target = await newTargetRes.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await new Promise(r => ws.onopen = r);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && callbacks.has(data.id)) {
        callbacks.get(data.id)(data.result);
        callbacks.delete(data.id);
      }
    };

    await send('Page.enable');
    await send('Runtime.enable');
    // Set 1440x1080 desktop viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to http://localhost:3000 ...');
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 4000));

    // Scroll to Fitting Lab and click "VIEW BACK (180°)"
    console.log('Scrolling to Fitting Lab Canvas and clicking View Back...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const lab = document.getElementById('fitting-lab');
          if (lab) {
            lab.scrollIntoView({ block: 'center' });
            setTimeout(() => {
              const viewBack = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('VIEW BACK'));
              if (viewBack) viewBack.click();
            }, 500);
          }
        })()
      `
    });

    await new Promise(r => setTimeout(r, 3000));
    const labCanvasShot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    fs.writeFileSync('public/test-lab-back.jpg', Buffer.from(labCanvasShot.data, 'base64'));
    console.log('Saved public/test-lab-back.jpg');

    // Click on a product card to open Product Modal
    console.log('Opening Product Detail Modal...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const productCards = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('QUICK VIEW'));
          if (productCards[0]) {
            productCards[0].click();
          } else {
            const img = document.querySelector('img[src*="chrome-spider"]');
            if (img) img.closest('div').click();
          }
        })()
      `
    });

    await new Promise(r => setTimeout(r, 2000));

    // Click 3D tab in modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('INTERACTIVE 3D'));
          if (tab) tab.click();
        })()
      `
    });

    await new Promise(r => setTimeout(r, 3000));
    const modal3DShot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    fs.writeFileSync('public/test-modal-3d.jpg', Buffer.from(modal3DShot.data, 'base64'));
    console.log('Saved public/test-modal-3d.jpg');

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
    try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (e) {}
  }
}

run();
