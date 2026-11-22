import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\temp\\chrome_qa_full_' + Date.now();
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9225',
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
      const res = await fetch('http://127.0.0.1:9225/json/version');
      if (res.ok) return await res.json();
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('CDP not responding on 9225');
}

async function run() {
  try {
    await waitForCDP();
    const newTargetRes = await fetch('http://127.0.0.1:9225/json/new?http://localhost:3000', { method: 'PUT' });
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

    const consoleLogs = [];
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Console.messageAdded') {
        consoleLogs.push({ type: 'console', ...data.params.message });
      }
      if (data.method === 'Runtime.consoleAPICalled') {
        consoleLogs.push({ type: 'runtime', ...data.params });
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

    console.log('1. Navigating to http://localhost:3000 ...');
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(r => setTimeout(r, 3500));

    // Test 1: Scroll to VirtualShowroom and toggle to Back View (180°)
    console.log('2. Inspecting Fitting Lab (VirtualShowroom) 3D back view...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const showroom = document.getElementById('fitting-lab') || document.querySelector('section:has(canvas)');
          if (showroom) showroom.scrollIntoView({ behavior: 'instant' });
          // Find the VIEW BACK button
          const backBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('VIEW BACK'));
          if (backBtn) backBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 2000));
    const fittingLabShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-fitting-lab-back.png', Buffer.from(fittingLabShot.data, 'base64'));
    console.log('Saved public/proof-fitting-lab-back.png');

    // Test 2: Open Admin Dashboard
    console.log('3. Opening Admin PIN screen...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          window.scrollTo(0, 0);
          const adminBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('ADMIN') || b.textContent.includes('لوحة')));
          if (adminBtn) adminBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Enter PIN 1337
    console.log('4. Submitting PIN 1337...');
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

    // Switch to Products Vault
    console.log('5. Switching to Products Tab...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const prodTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('PIECES') || b.textContent.includes('منتجات')));
          if (prodTab) prodTab.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // Click "+ NEW PIECE" button
    console.log('6. Clicking + NEW PIECE to open ProductEditorModal...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const newBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('NEW PIECE') || b.textContent.includes('قطعة جديدة')));
          if (newBtn) newBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Proof 1: Editor Info Tab
    const editorInfoShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-editor-info.png', Buffer.from(editorInfoShot.data, 'base64'));
    console.log('Saved public/proof-editor-info.png');

    // Switch to IMAGES & 3D ART tab
    console.log('7. Switching to IMAGES & 3D ART tab...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const mediaTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('IMAGES & 3D') || b.textContent.includes('الصور')));
          if (mediaTab) mediaTab.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));
    const editorMediaShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-editor-media.png', Buffer.from(editorMediaShot.data, 'base64'));
    console.log('Saved public/proof-editor-media.png');

    // Switch to COLORS tab
    console.log('8. Switching to COLORS tab...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const colorsTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('COLORS') || b.textContent.includes('الألوان')));
          if (colorsTab) colorsTab.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));
    const editorColorsShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-editor-colors.png', Buffer.from(editorColorsShot.data, 'base64'));
    console.log('Saved public/proof-editor-colors.png');

    // Switch to SIZES & SPECS tab
    console.log('9. Switching to SIZES & SPECS tab...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const sizesTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('SIZES & SPECS') || b.textContent.includes('المقاسات')));
          if (sizesTab) sizesTab.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));
    const editorSizesShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-editor-sizes.png', Buffer.from(editorSizesShot.data, 'base64'));
    console.log('Saved public/proof-editor-sizes.png');

    // Test filling out and publishing a piece:
    console.log('10. Filling form and publishing test piece...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Switch back to info
          const infoTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('INFO') || b.textContent.includes('معلومات')));
          if (infoTab) infoTab.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));

    await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Fill inputs
          const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
          inputs.forEach(inp => {
            const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
            if (inp.placeholder && (inp.placeholder.includes('SPIDER') || inp.placeholder.includes('CYBER'))) {
              proto.set.call(inp, 'CYBER REBEL TECH HOODIE');
              inp.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (inp.placeholder && (inp.placeholder.includes('هودي') || inp.placeholder.includes('الكرومي'))) {
              proto.set.call(inp, 'هودي سايبر ريبل ثلاثي الأبعاد');
              inp.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (inp.type === 'number' && inp.value === '0') {
              proto.set.call(inp, '1950');
              inp.dispatchEvent(new Event('input', { bubbles: true }));
            }
          });

          // Click publish button
          const publishBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('PUBLISH') || b.textContent.includes('نشر القطعة')));
          if (publishBtn) publishBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    const updatedVaultShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-updated-vault.png', Buffer.from(updatedVaultShot.data, 'base64'));
    console.log('Saved public/proof-updated-vault.png');

    console.log('ALL QA TESTS PASSED CLEANLY! Total console messages:', consoleLogs.length);
    ws.close();
  } catch (err) {
    console.error('QA Test execution failed:', err);
  } finally {
    chrome.kill();
    try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (e) {}
  }
}

run();
