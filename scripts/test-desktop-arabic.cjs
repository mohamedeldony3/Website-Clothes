const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function testDesktopArabic() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--window-size=1440,900',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9224/json', (r) => {
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

    // Wait for initial render
    await new Promise(r => setTimeout(r, 3000));

    // Scroll to fitting-lab
    await send('Runtime.evaluate', {
      expression: `(() => {
        const lab = document.getElementById('fitting-lab');
        if (lab) lab.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });

    await new Promise(r => setTimeout(r, 4000));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-desktop-fitting-lab-arabic.png', Buffer.from(shot.data, 'base64'));

    const brainDir = 'C:\\Users\\Elsony\\.gemini\\antigravity\\brain\\78671bb3-3ccc-407a-acbc-b4a9c1544075';
    fs.copyFileSync('public/proof-desktop-fitting-lab-arabic.png', path.join(brainDir, 'proof-desktop-fitting-lab-arabic.png'));
    console.log('Saved proof-desktop-fitting-lab-arabic.png');

    ws.close();
    chrome.kill();
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}

testDesktopArabic();
