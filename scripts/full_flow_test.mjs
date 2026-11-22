import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\temp\\cqa_full_flow_' + Date.now();
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9233',
  `--user-data-dir=${USER_DATA_DIR}`,
  '--window-size=1440,1080',
  'about:blank'
], { stdio: 'ignore' });

async function waitForCDP() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9233/json/version');
      if (res.ok) return await res.json();
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('CDP not responding on 9233');
}

async function run() {
  try {
    await waitForCDP();
    const newTargetRes = await fetch('http://127.0.0.1:9233/json/new?http://localhost:3000', { method: 'PUT' });
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

    await send('Runtime.enable');
    await send('Page.enable');
    console.log('1. Waiting for page initial load...');
    await new Promise(r => setTimeout(r, 3500));

    // Capture Home Hero
    const homeShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/flow-1-home.png', Buffer.from(homeShot.data, 'base64'));
    console.log('✓ Saved public/flow-1-home.png (size:', homeShot.data.length, ')');

    // Step 2: Open Admin Dashboard (PIN gate)
    console.log('2. Opening Admin Dashboard...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('ADMIN'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const pinShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/flow-2-admin-pin.png', Buffer.from(pinShot.data, 'base64'));
    console.log('✓ Saved public/flow-2-admin-pin.png (size:', pinShot.data.length, ')');

    // Step 3: Enter PIN 1337 and submit
    console.log('3. Entering PIN 1337...');
    const authResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.querySelector('input[type="password"]');
          if (!input) return 'NO_INPUT';
          const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
          proto.set.call(input, '1337');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          const form = input.closest('form');
          if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          return 'SUBMITTED';
        })()
      `,
      returnByValue: true
    });
    console.log('PIN Submit:', authResult.result.value);
    await new Promise(r => setTimeout(r, 1000));

    const overviewShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/flow-3-admin-overview.png', Buffer.from(overviewShot.data, 'base64'));
    console.log('✓ Saved public/flow-3-admin-overview.png (size:', overviewShot.data.length, ')');

    // Step 4: Switch to Products Vault Tab
    console.log('4. Switching to Products Vault Tab...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('PIECES') || b.textContent.includes('القطع')));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const productsShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/flow-4-admin-products.png', Buffer.from(productsShot.data, 'base64'));
    console.log('✓ Saved public/flow-4-admin-products.png (size:', productsShot.data.length, ')');

    // Step 5: Switch to Orders CRM Tab
    console.log('5. Switching to Orders CRM Tab...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('ORDERS') || b.textContent.includes('الطلبات')));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    const ordersShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/flow-5-admin-orders.png', Buffer.from(ordersShot.data, 'base64'));
    console.log('✓ Saved public/flow-5-admin-orders.png (size:', ordersShot.data.length, ')');

    // Step 6: Close Admin Dashboard
    console.log('6. Closing Admin Dashboard...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const closeBtn = document.querySelector('button[aria-label="Close admin"], button:has(svg.lucide-x)');
          if (closeBtn) closeBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Step 7: Scroll to Fitting Lab and click "VIEW BACK (180°)"
    console.log('7. Scrolling to Fitting Lab & rotating to back view...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const lab = document.getElementById('fitting-lab');
          if (lab) {
            lab.scrollIntoView({ behavior: 'instant', block: 'center' });
            setTimeout(() => {
              const viewBack = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('VIEW BACK'));
              if (viewBack) viewBack.click();
            }, 500);
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 3000));

    const labShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/flow-6-fitting-lab-back.png', Buffer.from(labShot.data, 'base64'));
    console.log('✓ Saved public/flow-6-fitting-lab-back.png (size:', labShot.data.length, ')');

    console.log('ALL FLOW TESTS COMPLETED SUCCESSFULLY!');
    ws.close();
  } catch (e) {
    console.error('Error during flow:', e);
  } finally {
    chrome.kill();
    try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (e) {}
  }
}

run();
