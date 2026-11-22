const { spawn } = require('child_process');
const http = require('http');

async function testWithPointerEventsNone() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--window-size=390,844',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9226/json', (r) => {
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
    await send('Input.setIgnoreInputEvents', { ignore: false });

    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true
    });

    await send('Emulation.setTouchEmulationEnabled', {
      enabled: true,
      maxTouchPoints: 5
    });

    await new Promise(r => setTimeout(r, 2000));

    // Experiment 1: set pointer-events: none on canvas
    await send('Runtime.evaluate', {
      expression: `(() => {
        const c = document.querySelector("#hero canvas");
        if (c) c.style.pointerEvents = 'none';
        const cWrap = document.querySelector("#hero .absolute.inset-0.z-0");
        if (cWrap) cWrap.style.pointerEvents = 'none';
      })()`
    });

    console.log('Synthesizing touch scroll with pointer-events: none...');
    await send('Input.synthesizeScrollGesture', {
      x: 195,
      y: 400,
      yDistance: -300,
      speed: 800,
      gestureSourceType: 'touch'
    });

    await new Promise(r => setTimeout(r, 1000));

    const scrollPos = await send('Runtime.evaluate', {
      expression: `window.scrollY`,
      returnByValue: true
    });
    console.log('ScrollY after touch gesture with pointer-events: none:', scrollPos.result.value);

    ws.close();
    chrome.kill();
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}

testWithPointerEventsNone();
