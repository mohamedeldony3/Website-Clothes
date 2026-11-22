const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function auditMobile() {
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

  await new Promise(r => setTimeout(r, 3000));

  // 1. Mobile Hero
  const snapHero = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/mobile-audit-hero.png', Buffer.from(snapHero.data, 'base64'));
  console.log('Saved mobile-audit-hero.png');

  // Check for horizontal overflow
  const overflow = await send('Runtime.evaluate', {
    expression: `(() => {
      const docW = document.documentElement.offsetWidth;
      const elementsWithOverflow = [];
      document.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.right > docW + 2) {
          elementsWithOverflow.push({
            tag: el.tagName,
            id: el.id,
            className: el.className.toString().slice(0, 80),
            right: r.right,
            width: r.width
          });
        }
      });
      return {
        bodyScrollWidth: document.body.scrollWidth,
        windowInnerWidth: window.innerWidth,
        overflowingElements: elementsWithOverflow.slice(0, 10)
      };
    })()`,
    returnByValue: true
  });
  console.log('Mobile Overflow Check:', JSON.stringify(overflow.result.value, null, 2));

  // 2. Scroll to Fitting Lab
  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('fitting-lab');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));
  const snapLab = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/mobile-audit-lab.png', Buffer.from(snapLab.data, 'base64'));
  console.log('Saved mobile-audit-lab.png');

  // 3. Scroll to Products Grid
  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('collection') || document.querySelector('.grid');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    })()`
  });
  await new Promise(r => setTimeout(r, 1500));
  const snapGrid = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/mobile-audit-grid.png', Buffer.from(snapGrid.data, 'base64'));
  console.log('Saved mobile-audit-grid.png');

  // 4. Test Navbar menu on Mobile
  await send('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo(0, 0);
      const menuBtn = document.querySelector('button[aria-label*=\"menu\"]') || Array.from(document.querySelectorAll('nav button')).find(b => b.querySelector('svg'));
      if (menuBtn) menuBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));
  const snapMenu = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/mobile-audit-menu.png', Buffer.from(snapMenu.data, 'base64'));
  console.log('Saved mobile-audit-menu.png');

  ws.close();
  chrome.kill();
  console.log('Mobile audit complete!');
}

auditMobile().catch(console.error);
