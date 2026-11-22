const { spawn } = require('child_process');
const http = require('http');

async function inspectMobileLayout() {
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

  // 1. Analyze Navbar items width and wrap
  const navReport = await send('Runtime.evaluate', {
    expression: `(() => {
      const header = document.querySelector('header');
      const navContainer = header ? header.querySelector('div.flex') : null;
      const logo = header ? header.querySelector('a') : null;
      const rightActions = header ? header.querySelector('div.flex.items-center:last-child') : null;
      const actionButtons = rightActions ? Array.from(rightActions.querySelectorAll('button')).map(b => ({
        text: b.textContent.trim(),
        aria: b.getAttribute('aria-label'),
        rect: { x: b.getBoundingClientRect().x, y: b.getBoundingClientRect().y, w: b.getBoundingClientRect().width, h: b.getBoundingClientRect().height }
      })) : [];

      return {
        headerRect: header ? header.getBoundingClientRect() : null,
        logoRect: logo ? logo.getBoundingClientRect() : null,
        rightActionsRect: rightActions ? rightActions.getBoundingClientRect() : null,
        actionButtons
      };
    })()`,
    returnByValue: true
  });
  console.log('NAVBAR AUDIT:', JSON.stringify(navReport.result.value, null, 2));

  // 2. Analyze Hero Elements: positions, overlaps with 3D model
  const heroReport = await send('Runtime.evaluate', {
    expression: `(() => {
      const h1 = document.querySelector('#hero h1');
      const ctaContainer = document.querySelector('#hero .lg\\\\:col-span-7 .flex.items-center');
      const canvas = document.querySelector('#hero canvas');
      const cartPill = document.querySelector('#hero aside');
      const topHud = document.querySelector('#hero .pt-3');
      const swipeHint = document.querySelector('#hero .sm\\\\:hidden.absolute');

      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) };
      };

      return {
        viewportH: window.innerHeight,
        topHud: rect(topHud),
        h1: rect(h1),
        h1Text: h1 ? h1.textContent : '',
        ctaContainer: rect(ctaContainer),
        canvas: rect(canvas),
        swipeHint: rect(swipeHint),
        cartPill: rect(cartPill)
      };
    })()`,
    returnByValue: true
  });
  console.log('HERO AUDIT:', JSON.stringify(heroReport.result.value, null, 2));

  ws.close();
  chrome.kill();
}

inspectMobileLayout().catch(console.error);
