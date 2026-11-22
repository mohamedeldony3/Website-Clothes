const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function testColor() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9241',
    '--window-size=1280,900',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 3500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9241/json', (r) => {
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

    // Scroll to fitting-lab
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('fitting-lab');
        if (el) el.scrollIntoView();
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    // Click Revelation hoodie thumbnail in the fitting lab
    const selectRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const stage = document.getElementById('fitting-lab');
        if (!stage) return 'no stage';
        const buttons = Array.from(stage.querySelectorAll('button'));
        const revBtn = buttons.find(b => b.textContent && (b.textContent.includes('ريفيليشن') || b.textContent.includes('REVELATION')));
        if (revBtn) {
          revBtn.click();
          return 'clicked rev';
        }
        return 'rev button not found';
      })()`,
      returnByValue: true
    });
    console.log('Select piece result:', selectRes.result?.value);
    await new Promise(r => setTimeout(r, 1500));

    // Now click the green swatch (Acid Moss or Forest)
    const swatchRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const stage = document.getElementById('fitting-lab');
        const colorTitle = stage.querySelector('strong.text-white');
        const swatches = Array.from(stage.querySelectorAll('button[title]'));
        const greenSwatch = swatches.find(s => s.getAttribute('title').includes('زيتي') || s.getAttribute('title').includes('أخضر') || s.getAttribute('title').includes('Olive') || s.getAttribute('title').includes('Pine'));
        if (greenSwatch) {
          greenSwatch.click();
          return 'clicked swatch: ' + greenSwatch.getAttribute('title');
        }
        return 'no green swatch found. Swatches: ' + swatches.map(s => s.getAttribute('title')).join(', ');
      })()`,
      returnByValue: true
    });
    console.log('Swatch click result:', swatchRes.result?.value);
    await new Promise(r => setTimeout(r, 1500));

    // Take screenshot of the fitting lab
    const screen = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-current-fitting-lab-color.png', Buffer.from(screen.data, 'base64'));
    console.log('Saved public/proof-current-fitting-lab-color.png');

    // Inspect the 3D hoodie mesh material properties from window or three
    const inspectRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const canvas = document.querySelector('#fitting-lab canvas');
        if (!canvas) return 'no canvas';
        const ctx = canvas.getContext('2d') || canvas.getContext('webgl2') || canvas.getContext('webgl');
        return 'canvas found: ' + canvas.width + 'x' + canvas.height;
      })()`,
      returnByValue: true
    });
    console.log('Canvas inspect:', inspectRes.result?.value);

  } finally {
    try { chrome.kill(); } catch {}
  }
}

testColor();
