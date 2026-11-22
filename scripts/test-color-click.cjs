const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function testColorClick() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=390,844',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const targets = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9222/json', (r) => {
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
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 2000));

  // Switch to Arabic
  await send('Runtime.evaluate', {
    expression: `(() => {
      const b = Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('عربي'));
      if (b) b.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1500));

  // Click the Chalk White swatch (index 2 for Spider hoodie)
  const clickedColor = await send('Runtime.evaluate', {
    expression: `(() => {
      const swatches = Array.from(document.querySelectorAll('button[aria-label]'));
      const whiteSwatch = swatches.find(s => {
        const title = s.getAttribute('title') || '';
        const label = s.getAttribute('aria-label') || '';
        return title.includes('أبيض') || label.includes('White') || label.includes('Chalk');
      });
      if (whiteSwatch) {
        whiteSwatch.click();
        return whiteSwatch.getAttribute('title');
      }
      return 'not found';
    })()`,
    returnByValue: true
  });
  console.log('Clicked swatch:', clickedColor.result.value);
  await new Promise(r => setTimeout(r, 2500));

  const snapWhite = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-mobile-hero-color-white-actual.png', Buffer.from(snapWhite.data, 'base64'));
  console.log('Saved proof-mobile-hero-color-white-actual.png');

  ws.close();
  chrome.kill();
}

testColorClick().catch(console.error);
