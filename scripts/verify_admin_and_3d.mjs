import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\temp\\chrome_qa_admin_' + Date.now();
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9224',
  `--user-data-dir=${USER_DATA_DIR}`,
  '--use-gl=angle',
  '--use-angle=d3d11',
  '--enable-webgl',
  '--ignore-gpu-blocklist',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
], { stdio: 'ignore' });

async function waitForCDP() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9224/json/version');
      if (res.ok) return await res.json();
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('CDP not responding on 9224');
}

async function run() {
  try {
    await waitForCDP();
    const newTargetRes = await fetch('http://127.0.0.1:9224/json/new?http://localhost:3000', { method: 'PUT' });
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

    const consoleMessages = [];
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Console.messageAdded') {
        consoleMessages.push(data.params.message);
      }
      if (data.method === 'Runtime.consoleAPICalled') {
        consoleMessages.push(data.params);
      }
      if (data.id && callbacks.has(data.id)) {
        callbacks.get(data.id)(data.result);
        callbacks.delete(data.id);
      }
    };

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Console.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to http://localhost:3000 ...');
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 3500));

    // Test 1: Click "ADMIN" button in Navbar
    console.log('Opening Admin Dashboard (PIN gate)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('ADMIN') || b.textContent.includes('لوحة التحكم')));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const pinShot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    fs.writeFileSync('public/qa-admin-pin.jpg', Buffer.from(pinShot.data, 'base64'));
    console.log('Saved public/qa-admin-pin.jpg');

    // Test 2: Enter PIN '1337' and submit
    console.log('Entering PIN 1337...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.querySelector('input[type="password"]');
          if (input) {
            const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
            proto.set.call(input, '1337');
            input.dispatchEvent(new Event('input', { bubbles: true }));
            const form = input.closest('form');
            if (form) {
              form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    const overviewShot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    fs.writeFileSync('public/qa-admin-overview.jpg', Buffer.from(overviewShot.data, 'base64'));
    console.log('Saved public/qa-admin-overview.jpg');

    // Test 3: Click Products Tab
    console.log('Switching to Products Tab in Admin...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('PIECES') || b.textContent.includes('منتجات')));
          if (tab) tab.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));
    const prodShot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    fs.writeFileSync('public/qa-admin-products.jpg', Buffer.from(prodShot.data, 'base64'));
    console.log('Saved public/qa-admin-products.jpg');

    // Test 4: Click Orders Tab
    console.log('Switching to Orders Tab in Admin...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const tab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('ORDERS') || b.textContent.includes('الطلبات')));
          if (tab) tab.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));
    const orderShot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    fs.writeFileSync('public/qa-admin-orders.jpg', Buffer.from(orderShot.data, 'base64'));
    console.log('Saved public/qa-admin-orders.jpg');

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

    console.log('QA Verification Completed. Total console logs:', consoleMessages.length);
    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    chrome.kill();
    try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (e) {}
  }
}

run();
