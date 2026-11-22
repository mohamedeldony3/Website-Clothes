const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function verifyAll() {
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

  // 1. Capture Hero Section (Front Chest Spider Graphic)
  await new Promise(r => setTimeout(r, 3500));
  const heroSnap = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-final-hero.png', Buffer.from(heroSnap.data, 'base64'));
  console.log('Hero screenshot: public/proof-final-hero.png');

  // 2. Scroll to Fitting Lab 3D stage and capture initial view (Spider Front)
  await send('Runtime.evaluate', {
    expression: 'document.getElementById("fitting-lab").querySelector(".grid").scrollIntoView({ block: "center" });'
  });
  await new Promise(r => setTimeout(r, 3000));
  const labSnap1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-final-lab-spider-front.png', Buffer.from(labSnap1.data, 'base64'));
  console.log('Lab Spider Front: public/proof-final-lab-spider-front.png');

  // 3. Click "VIEW BACK (180°)" to inspect Back Statement Artwork
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('#fitting-lab button')).find(b => b.textContent.includes('VIEW BACK') || b.textContent.includes('180°'));
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 2000));
  const labSnapBack = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-final-lab-spider-back.png', Buffer.from(labSnapBack.data, 'base64'));
  console.log('Lab Spider Back: public/proof-final-lab-spider-back.png');

  // 4. Click Savage drop in archive carousel
  await send('Runtime.evaluate', {
    expression: `(() => {
      const dropButtons = Array.from(document.querySelectorAll('#fitting-lab button'));
      const savageBtn = dropButtons.find(b => b.textContent.includes('سافاج') || b.textContent.includes('SAVAGE') || b.textContent.includes('سافا'));
      if (savageBtn) savageBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 2500));
  const labSnapSavage = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-final-lab-savage.png', Buffer.from(labSnapSavage.data, 'base64'));
  console.log('Lab Savage: public/proof-final-lab-savage.png');

  // 5. Click Tokyo Wave drop
  await send('Runtime.evaluate', {
    expression: `(() => {
      const dropButtons = Array.from(document.querySelectorAll('#fitting-lab button'));
      const tokyoBtn = dropButtons.find(b => b.textContent.includes('طوكيو') || b.textContent.includes('TOKYO'));
      if (tokyoBtn) tokyoBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 2500));
  const labSnapTokyo = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('public/proof-final-lab-tokyo.png', Buffer.from(labSnapTokyo.data, 'base64'));
  console.log('Lab Tokyo: public/proof-final-lab-tokyo.png');

  ws.close();
  chrome.kill();
  console.log('All verification captures completed successfully!');
}

verifyAll().catch(err => {
  console.error(err);
  process.exit(1);
});
