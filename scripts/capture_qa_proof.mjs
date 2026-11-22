import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\temp\\cqa_proof_' + Date.now();
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9227',
  `--user-data-dir=${USER_DATA_DIR}`,
  '--window-size=1440,1080',
  'about:blank'
], { stdio: 'ignore' });

async function waitForCDP() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9227/json/version');
      if (res.ok) return await res.json();
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('CDP not responding on 9227');
}

async function run() {
  try {
    await waitForCDP();
    const newTargetRes = await fetch('http://127.0.0.1:9227/json/new?http://localhost:3000', { method: 'PUT' });
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

    console.log('Waiting for page to be fully loaded and interactive...');
    await new Promise(r => setTimeout(r, 4500));

    // 1. Open Admin Dashboard and unlock with PIN
    console.log('Testing Admin Dashboard...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('ADMIN') || b.textContent.includes('لوحة التحكم')));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Enter PIN 1337
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.querySelector('input[type="password"]');
          if (input) {
            const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
            proto.set.call(input, '1337');
            input.dispatchEvent(new Event('input', { bubbles: true }));
            const form = input.closest('form');
            if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    const adminShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-admin-dashboard.png', Buffer.from(adminShot.data, 'base64'));
    console.log('Saved public/proof-admin-dashboard.png, bytes:', adminShot.data.length);

    // Close Admin Modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const closeBtn = document.querySelector('button[aria-label="Close admin"], button:has(svg.lucide-x)');
          if (closeBtn) closeBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // 2. Scroll to Fitting Lab and View Back
    console.log('Testing Fitting Lab...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const lab = document.getElementById('fitting-lab');
          if (lab) {
            lab.scrollIntoView({ block: 'center' });
            setTimeout(() => {
              const viewBack = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('VIEW BACK'));
              if (viewBack) viewBack.click();
            }, 600);
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 3500));

    const labShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-fitting-lab-back.png', Buffer.from(labShot.data, 'base64'));
    console.log('Saved public/proof-fitting-lab-back.png, bytes:', labShot.data.length);

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
    try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (e) {}
  }
}

run();
