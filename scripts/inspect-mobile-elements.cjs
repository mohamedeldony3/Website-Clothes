const { spawn } = require('child_process');
const http = require('http');

async function inspectElements() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=390,844',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);
  await new Promise(r => setTimeout(r, 2000));

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

  const heroDetails = await send('Runtime.evaluate', {
    expression: `(() => {
      const hero = document.querySelector('section');
      const h1 = document.querySelector('h1');
      const cartPill = document.querySelector('aside');
      const ctaBtns = Array.from(document.querySelectorAll('section a, section button')).map(b => ({
        text: b.textContent.trim().replace(/\\s+/g, ' ').slice(0, 30),
        rect: b.getBoundingClientRect()
      }));
      return {
        heroRect: hero ? hero.getBoundingClientRect() : null,
        h1Rect: h1 ? h1.getBoundingClientRect() : null,
        h1Text: h1 ? h1.textContent : '',
        cartPillRect: cartPill ? cartPill.getBoundingClientRect() : null,
        ctaCount: ctaBtns.length,
        ctaSample: ctaBtns.filter(c => c.rect.width > 0 && c.rect.height > 0).slice(0, 10)
      };
    })()`,
    returnByValue: true
  });
  console.log('Hero Mobile Analysis:', JSON.stringify(heroDetails.result.value, null, 2));

  // Inspect Fitting Lab on mobile
  const labDetails = await send('Runtime.evaluate', {
    expression: `(() => {
      const lab = document.getElementById('fitting-lab');
      if (!lab) return null;
      lab.scrollIntoView({ behavior: 'instant' });
      const stage = lab.querySelector('.lg\\\\:col-span-8');
      const controls = lab.querySelector('.lg\\\\:col-span-4');
      return {
        labRect: lab.getBoundingClientRect(),
        stageRect: stage ? stage.getBoundingClientRect() : null,
        controlsRect: controls ? controls.getBoundingClientRect() : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Lab Mobile Analysis:', JSON.stringify(labDetails.result.value, null, 2));

  ws.close();
  chrome.kill();
}

inspectElements().catch(console.error);
