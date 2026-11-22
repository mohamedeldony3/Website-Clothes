const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function testCurrent() {
  const targets = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9222/json', (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  }).catch(() => null);

  let chrome = null;
  let pageTarget = targets ? targets.find(t => t.type === 'page' && t.url.includes('3000')) : null;

  if (!pageTarget) {
    chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
      '--headless=new',
      '--remote-debugging-port=9222',
      '--window-size=1440,950',
      '--no-sandbox',
      '--disable-gpu',
      'http://localhost:3000'
    ]);
    await new Promise(r => setTimeout(r, 2500));
    const targets2 = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9222/json', (r) => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => res(JSON.parse(d)));
      }).on('error', rej);
    });
    pageTarget = targets2.find(t => t.type === 'page' && t.url.includes('3000'));
  }

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

  // Scroll to fitting lab section
  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('fitting-lab') || Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('FITTING') || h.textContent.includes('معمل'));
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    })()`
  });
  await new Promise(r => setTimeout(r, 2500));
  const snap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-current-fitting-lab.png', Buffer.from(snap.data, 'base64'));
  console.log('Saved public/proof-current-fitting-lab.png');

  ws.close();
  if (chrome) chrome.kill();
}

testCurrent().catch(console.error);
