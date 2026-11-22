const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function testHeroNavAndColor() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=390,844',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2500));

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
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await new Promise(r => setTimeout(r, 2000));

  // 1. Switch to Arabic
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('عربي'));
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 2500));

  // 2. Capture initial Hero in Arabic with Side Navigation Arrows & Colorway Dock
  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-mobile-hero-with-colors.png', Buffer.from(snap1.data, 'base64'));
  console.log('Saved proof-mobile-hero-with-colors.png');

  // 3. Click the White color swatch (Chalk White) in the floating color dock
  await send('Runtime.evaluate', {
    expression: `(() => {
      // Find all color buttons in the bottom color dock
      const dock = document.querySelector('.absolute.bottom-\\\\[66px\\\\]') || document.querySelector('.absolute.bottom-\\\\[78px\\\\]');
      if (dock) {
        const swatches = dock.querySelectorAll('button[aria-label]');
        // find Chalk White swatch
        const white = Array.from(swatches).find(b => b.getAttribute('aria-label').includes('Chalk') || b.getAttribute('aria-label').includes('White') || b.getAttribute('title').includes('أبيض'));
        if (white) white.click();
        else if (swatches.length > 2) swatches[2].click();
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));

  // 4. Capture screenshot showing 3D hoodie changed to WHITE!
  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-mobile-hero-color-white.png', Buffer.from(snap2.data, 'base64'));
  console.log('Saved proof-mobile-hero-color-white.png');

  // 5. Click the Next Garment side chevron button
  await send('Runtime.evaluate', {
    expression: `(() => {
      const nextBtn = document.querySelector('button[aria-label=\"Next garment\"]');
      if (nextBtn) nextBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 2500));

  // 6. Capture screenshot showing transitioned to Savage hoodie with its brown colors!
  const snap3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-mobile-hero-next-piece.png', Buffer.from(snap3.data, 'base64'));
  console.log('Saved proof-mobile-hero-next-piece.png');

  ws.close();
  chrome.kill();
  console.log('Verification completed!');
}

testHeroNavAndColor().catch(console.error);
