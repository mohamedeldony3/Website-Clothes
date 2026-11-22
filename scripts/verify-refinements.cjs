const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function verifyAllRefinements() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1440,1050',
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

  // 1. Initial Hero view: Spider front
  await new Promise(r => setTimeout(r, 3500));
  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-refined-hero-spider-front.png', Buffer.from(snap1.data, 'base64'));
  console.log('Saved proof-refined-hero-spider-front.png');

  // 2. Flip Hero to back view (180°)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('button[title*=\"Front / Back\"]');
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1500));
  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-refined-hero-spider-back.png', Buffer.from(snap2.data, 'base64'));
  console.log('Saved proof-refined-hero-spider-back.png');

  // 3. Scroll to VirtualShowroom (Fitting Lab)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.getElementById('fitting-lab');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));

  // 4. In Fitting Lab: Click Tokyo Wave Drop (white)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('#fitting-lab button'));
      const tokyo = btns.find(b => b.textContent.includes('طوكيو') || b.textContent.includes('TOKYO'));
      if (tokyo) tokyo.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));
  const snap3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-refined-lab-tokyo-front.png', Buffer.from(snap3.data, 'base64'));
  console.log('Saved proof-refined-lab-tokyo-front.png');

  // 5. In Fitting Lab: Flip Tokyo to Back View (180°)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('#fitting-lab button')).find(b => b.textContent.includes('VIEW BACK') || b.textContent.includes('180°'));
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1500));
  const snap4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-refined-lab-tokyo-back.png', Buffer.from(snap4.data, 'base64'));
  console.log('Saved proof-refined-lab-tokyo-back.png');

  // 6. In Fitting Lab: Click Savage Drop
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('#fitting-lab button'));
      const savage = btns.find(b => b.textContent.includes('سافاج') || b.textContent.includes('SAVAGE') || b.textContent.includes('سافا'));
      if (savage) savage.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));
  const snap5 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-refined-lab-savage-front.png', Buffer.from(snap5.data, 'base64'));
  console.log('Saved proof-refined-lab-savage-front.png');

  ws.close();
  chrome.kill();
  console.log('All refined proofs captured successfully!');
}

verifyAllRefinements().catch(console.error);
