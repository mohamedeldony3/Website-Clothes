const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function testCDP() {
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
  if (!pageTarget) {
    console.error('No page target found');
    chrome.kill();
    return;
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  ws.onmessage = (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === 'Console.messageAdded') {
      console.log('BROWSER LOG:', msg.params.message.text);
    }
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
  await send('Console.enable');
  await send('Page.enable');
  
  // Wait 3 seconds for Three.js render
  await new Promise(r => setTimeout(r, 3000));

  // Take Hero screenshot
  const heroSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-cdp-hero.png', Buffer.from(heroSnap.data, 'base64'));
  console.log('Hero screenshot saved: public/proof-cdp-hero.png');

  // Scroll to fitting-lab and capture
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("fitting-lab").scrollIntoView();'
  });
  await new Promise(r => setTimeout(r, 3000));
  const labSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-cdp-lab.png', Buffer.from(labSnap.data, 'base64'));
  console.log('Lab screenshot saved: public/proof-cdp-lab.png');

  ws.close();
  chrome.kill();
}

testCDP().catch(err => {
  console.error(err);
  process.exit(1);
});
