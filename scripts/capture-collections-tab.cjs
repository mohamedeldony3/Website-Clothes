const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function captureAccurate() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9240',
    '--window-size=1280,900',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 3500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9240/json', (r) => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => res(JSON.parse(d)));
      }).on('error', rej);
    });

    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('3000'));
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

    // Authenticate
    await send('Runtime.evaluate', {
      expression: `(() => {
        sessionStorage.setItem('mono_admin_auth', 'true');
        location.reload();
      })()`
    });
    await new Promise(r => setTimeout(r, 2500));

    // Open Admin
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent && (b.textContent.includes('ADMIN') || b.textContent.includes('لوحة التحكم')));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));

    // Find tab inside modal
    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('.fixed.inset-0.z-50');
        if (!modal) return null;
        const tabs = Array.from(modal.querySelectorAll('button'));
        const colTab = tabs.find(t => t.textContent && t.textContent.includes('COLLECTIONS (التشكيلات)'));
        if (colTab) {
          const rect = colTab.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, text: colTab.textContent };
        }
        return null;
      })()`,
      returnByValue: true
    });

    console.log('Admin modal colTab:', res.result?.value);
    const coords = res.result?.value;
    if (coords) {
      await send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: coords.x,
        y: coords.y,
        button: 'left',
        clickCount: 1
      });
      await send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: coords.x,
        y: coords.y,
        button: 'left',
        clickCount: 1
      });
    }

    await new Promise(r => setTimeout(r, 1500));

    // Capture Collections Tab
    const tabScreen = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-admin-collections-tab.png', Buffer.from(tabScreen.data, 'base64'));
    console.log('Saved public/proof-admin-collections-tab.png');

    // Find Edit button on first collection card inside modal
    const editRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const modal = document.querySelector('.fixed.inset-0.z-50');
        if (!modal) return null;
        const btns = Array.from(modal.querySelectorAll('button'));
        const editBtn = btns.find(b => b.textContent && b.textContent.includes('تعديل (EDIT)'));
        if (editBtn) {
          const rect = editBtn.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
        return null;
      })()`,
      returnByValue: true
    });

    console.log('Edit button coords:', editRes.result?.value);
    const editCoords = editRes.result?.value;
    if (editCoords) {
      await send('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x: editCoords.x,
        y: editCoords.y,
        button: 'left',
        clickCount: 1
      });
      await send('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: editCoords.x,
        y: editCoords.y,
        button: 'left',
        clickCount: 1
      });
    }

    await new Promise(r => setTimeout(r, 1500));

    // Capture Edit Modal
    const modalScreen = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-admin-collection-edit-modal.png', Buffer.from(modalScreen.data, 'base64'));
    console.log('Saved public/proof-admin-collection-edit-modal.png');

  } finally {
    try { chrome.kill(); } catch {}
  }
}

captureAccurate();
