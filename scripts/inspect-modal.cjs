const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function testModal() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1440,1000',
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

  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('#shop .cursor-pointer');
      if (card) {
        card.click();
        return 'clicked card';
      }
      return 'card not found';
    })()`,
    returnByValue: true
  });
  console.log('Click result:', res.result?.value);
  await new Promise(r => setTimeout(r, 3000));

  const modalInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.querySelector('.fixed.inset-0.z-50');
      if (!modal) return 'no modal in DOM';
      const rect = modal.getBoundingClientRect();
      const canvas = modal.querySelector('canvas');
      return {
        modalVisible: !!modal,
        rect: { width: rect.width, height: rect.height, top: rect.top },
        hasCanvas: !!canvas,
        canvasSize: canvas ? { w: canvas.width, h: canvas.height } : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Modal info:', modalInfo.result?.value);

  const modalSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-cdp-modal.png', Buffer.from(modalSnap.data, 'base64'));
  console.log('Modal screenshot saved: public/proof-cdp-modal.png');

  ws.close();
  chrome.kill();
}

testModal().catch(err => {
  console.error(err);
  process.exit(1);
});
