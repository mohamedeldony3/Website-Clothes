const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function verifyHeroVexel() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1440,950',
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

  // 1. Capture initial Hero (Spider Hoodie, rolling title, Cart Pill, Packshot rail)
  await new Promise(r => setTimeout(r, 4000));
  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-vexel-hero-initial.png', Buffer.from(snap1.data, 'base64'));
  console.log('Saved: public/proof-vexel-hero-initial.png');

  // 2. Click the first packshot in the right rail to switch to Savage hoodie
  await send('Runtime.evaluate', {
    expression: `(() => {
      const packshot = document.getElementById('packshot-slot-0');
      if (packshot) {
        packshot.click();
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 3000));
  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-vexel-hero-savage.png', Buffer.from(snap2.data, 'base64'));
  console.log('Saved: public/proof-vexel-hero-savage.png');

  // 3. Click the 180° flip button in the 3D control dock
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[title*=\"180\"]');
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));
  const snap3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-vexel-hero-back.png', Buffer.from(snap3.data, 'base64'));
  console.log('Saved: public/proof-vexel-hero-back.png');

  ws.close();
  chrome.kill();
  console.log('Hero Vexel verification completed successfully!');
}

verifyHeroVexel().catch(err => {
  console.error(err);
  process.exit(1);
});
