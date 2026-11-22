const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function debugColor() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9242',
    '--window-size=1280,900',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 3500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9242/json', (r) => {
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

    // Scroll directly to fitting-lab by position
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('fitting-lab');
        if (el) {
          const pos = el.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top: pos, behavior: 'instant' });
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));

    // Click Revelation hoodie thumbnail
    const clickRev = await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = Array.from(document.querySelectorAll('#fitting-lab button'));
        const rev = btns.find(b => b.textContent && b.textContent.includes('ريفيليشن'));
        if (rev) {
          rev.click();
          return 'clicked revelation thumbnail';
        }
        return 'not found';
      })()`,
      returnByValue: true
    });
    console.log('Click rev:', clickRev.result?.value);
    await new Promise(r => setTimeout(r, 1500));

    // Inspect swatches
    const swatchInfo = await send('Runtime.evaluate', {
      expression: `(() => {
        const swatches = Array.from(document.querySelectorAll('#fitting-lab button[title]'));
        return swatches.map(s => ({
          title: s.getAttribute('title'),
          bg: s.style.backgroundColor
        }));
      })()`,
      returnByValue: true
    });
    console.log('Swatches available:', swatchInfo.result?.value);

    // Click swatch with olive/green
    const clickSwatch = await send('Runtime.evaluate', {
      expression: `(() => {
        const swatches = Array.from(document.querySelectorAll('#fitting-lab button[title]'));
        const olive = swatches.find(s => s.getAttribute('title').includes('زيتي') || s.getAttribute('title').includes('Olive') || s.getAttribute('title').includes('373A32'));
        if (olive) {
          olive.click();
          return 'clicked: ' + olive.getAttribute('title');
        }
        return 'olive swatch not found';
      })()`,
      returnByValue: true
    });
    console.log('Click swatch result:', clickSwatch.result?.value);
    await new Promise(r => setTimeout(r, 1500));

    // Take screenshot of fitting-lab
    const screen = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-debug-olive-render.png', Buffer.from(screen.data, 'base64'));
    console.log('Saved public/proof-debug-olive-render.png');

  } finally {
    try { chrome.kill(); } catch {}
  }
}

debugColor();
