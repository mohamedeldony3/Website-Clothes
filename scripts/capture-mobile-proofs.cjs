const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function captureMobileProofs() {
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

  // Switch to Arabic to test the user's exact configuration
  await send('Runtime.evaluate', {
    expression: `(() => {
      const langBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('عربي'));
      if (langBtn) langBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Mobile Hero Proof
  const snapHero = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-mobile-hero.png', Buffer.from(snapHero.data, 'base64'));
  console.log('Saved proof-mobile-hero.png');

  // 2. Mobile Hero Back Flip (180°) via Cart Pill button
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('aside button[title*=\"Front / Back\"]') || Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('180°') || b.textContent.includes('BACK'));
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1500));
  const snapHeroBack = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-mobile-hero-back.png', Buffer.from(snapHeroBack.data, 'base64'));
  console.log('Saved proof-mobile-hero-back.png');

  // 3. Scroll to Collections on Mobile
  await send('Runtime.evaluate', {
    expression: `document.getElementById('collections').scrollIntoView({ behavior: 'instant', block: 'start' });`
  });
  await new Promise(r => setTimeout(r, 1500));
  const snapCollections = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-mobile-collections.png', Buffer.from(snapCollections.data, 'base64'));
  console.log('Saved proof-mobile-collections.png');

  // 4. Scroll to Fitting Lab on Mobile
  await send('Runtime.evaluate', {
    expression: `document.getElementById('fitting-lab').scrollIntoView({ behavior: 'instant', block: 'start' });`
  });
  await new Promise(r => setTimeout(r, 2000));
  const snapLab = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-mobile-fitting-lab.png', Buffer.from(snapLab.data, 'base64'));
  console.log('Saved proof-mobile-fitting-lab.png');

  // 5. Scroll to 2-Column Product Grid on Mobile
  await send('Runtime.evaluate', {
    expression: `document.getElementById('shop').scrollIntoView({ behavior: 'instant', block: 'start' });`
  });
  await new Promise(r => setTimeout(r, 1500));
  const snapGrid = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-mobile-grid-2col.png', Buffer.from(snapGrid.data, 'base64'));
  console.log('Saved proof-mobile-grid-2col.png');

  // 6. Click on first Product Card to open Mobile Product Modal
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cardImg = document.querySelector('#shop .grid > div img');
      if (cardImg) cardImg.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));
  const snapModal = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-mobile-product-modal.png', Buffer.from(snapModal.data, 'base64'));
  console.log('Saved proof-mobile-product-modal.png');

  ws.close();
  chrome.kill();
  console.log('All mobile proofs captured successfully!');
}

captureMobileProofs().catch(console.error);
