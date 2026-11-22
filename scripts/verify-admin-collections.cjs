const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function verifyAdminAndCollections() {
  console.log('Starting Collections & Admin Verification on port 9237...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9237',
    '--window-size=1280,900',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 3500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9237/json', (r) => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => res(JSON.parse(d)));
      }).on('error', rej);
    });

    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('3000'));
    if (!pageTarget) throw new Error('No page target found on port 9237');

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let id = 1;
    const pending = new Map();
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      }
    };

    const send = (method, params = {}) => new Promise(resolve => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

    await new Promise(r => ws.onopen = r);
    await send('Page.enable');
    await send('Runtime.enable');

    // Desktop Admin Viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 850,
      deviceScaleFactor: 1,
      mobile: false,
      hasTouch: false
    });
    await new Promise(r => setTimeout(r, 1000));

    // Authenticate via sessionStorage and reload page to activate authenticated state
    await send('Runtime.evaluate', {
      expression: `(() => {
        sessionStorage.setItem('mono_admin_auth', 'true');
        location.reload();
      })()`
    });
    await new Promise(r => setTimeout(r, 2500));

    // Open Admin Command Center
    await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent && (b.textContent.includes('ADMIN') || b.textContent.includes('لوحة التحكم')));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));

    // Click on COLLECTIONS Tab
    await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const colTab = buttons.find(b => b.textContent && (b.textContent.includes('COLLECTIONS') || b.textContent.includes('التشكيلات')));
        if (colTab) colTab.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    // Capture screenshot of Admin Collections Tab
    const adminColScreen = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-admin-collections-tab.png', Buffer.from(adminColScreen.data, 'base64'));
    console.log('Saved public/proof-admin-collections-tab.png');

    // Click "تعديل (EDIT)" on first collection
    await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const editBtn = buttons.find(b => b.textContent && b.textContent.includes('تعديل (EDIT)'));
        if (editBtn) editBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    // Capture screenshot of Collection Editor Modal
    const modalScreen = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-admin-collection-edit-modal.png', Buffer.from(modalScreen.data, 'base64'));
    console.log('Saved public/proof-admin-collection-edit-modal.png');

    console.log('All verification proofs captured successfully!');
  } catch (e) {
    console.error('Error during verification:', e);
  } finally {
    try { chrome.kill(); } catch {}
  }
}

verifyAdminAndCollections();
