const { spawn } = require('child_process');
const http = require('http');

async function inspectLab() {
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

  const labReport = await send('Runtime.evaluate', {
    expression: `(() => {
      const lab = document.getElementById('fitting-lab');
      lab.scrollIntoView({ behavior: 'instant', block: 'start' });
      const stage = lab.querySelector('.lg\\\\:col-span-8');
      const customizer = lab.querySelector('.lg\\\\:col-span-4');
      const drops = Array.from(stage.querySelectorAll('.overflow-x-auto button')).map(b => ({
        text: b.textContent.trim(),
        w: b.getBoundingClientRect().width,
        h: b.getBoundingClientRect().height
      }));

      const utilityBtns = Array.from(stage.querySelectorAll('.relative.z-10 button')).map(b => ({
        text: b.textContent.trim(),
        w: b.getBoundingClientRect().width,
        h: b.getBoundingClientRect().height
      }));

      return {
        stageH: stage ? stage.getBoundingClientRect().height : 0,
        customizerH: customizer ? customizer.getBoundingClientRect().height : 0,
        totalLabH: lab.getBoundingClientRect().height,
        dropsCount: drops.length,
        utilityBtns
      };
    })()`,
    returnByValue: true
  });
  console.log('LAB AUDIT:', JSON.stringify(labReport.result.value, null, 2));

  ws.close();
  chrome.kill();
}

inspectLab().catch(console.error);
