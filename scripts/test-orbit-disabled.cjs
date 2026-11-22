const { spawn } = require('child_process');
const http = require('http');

async function testOrbitControlsDisabled() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9229',
    '--window-size=390,844',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9229/json', (r) => {
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

    // Experiment A: Touch gesture over the bottom bar
    const barScroll = await (async () => {
      console.log('Synthesizing touch scroll over bottom bar (x=195, y=780)...');
      await send('Input.synthesizeScrollGesture', {
        x: 195,
        y: 780,
        yDistance: -300,
        speed: 800,
        gestureSourceType: 'touch'
      });
      await new Promise(r => setTimeout(r, 1000));
      const s = await send('Runtime.evaluate', { expression: `window.scrollY`, returnByValue: true });
      return s.result.value;
    })();
    console.log('ScrollY after touch over bottom bar:', barScroll);

    // Reset scroll
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0)` });
    await new Promise(r => setTimeout(r, 500));

    // Experiment B: What happens if canvas has pointer-events: none?
    await send('Runtime.evaluate', {
      expression: `(() => {
        const c = document.querySelector("#hero canvas");
        if (c) {
          c.style.pointerEvents = 'none';
          c.parentElement.style.pointerEvents = 'none';
          c.parentElement.parentElement.style.pointerEvents = 'none';
        }
      })()`
    });

    console.log('Synthesizing touch scroll in center with canvas pointerEvents: none...');
    await send('Input.synthesizeScrollGesture', {
      x: 195,
      y: 400,
      yDistance: -300,
      speed: 800,
      gestureSourceType: 'touch'
    });
    await new Promise(r => setTimeout(r, 1000));
    const s2 = await send('Runtime.evaluate', { expression: `window.scrollY`, returnByValue: true });
    console.log('ScrollY after touch in center with canvas pointerEvents: none:', s2.result.value);

    // Experiment C: What if #hero has overflow: visible?
    await send('Runtime.evaluate', {
      expression: `(() => {
        document.getElementById('hero').style.overflow = 'visible';
      })()`
    });
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0)` });
    await new Promise(r => setTimeout(r, 500));

    console.log('Synthesizing touch scroll in center with hero overflow: visible...');
    await send('Input.synthesizeScrollGesture', {
      x: 195,
      y: 400,
      yDistance: -300,
      speed: 800,
      gestureSourceType: 'touch'
    });
    await new Promise(r => setTimeout(r, 1000));
    const s3 = await send('Runtime.evaluate', { expression: `window.scrollY`, returnByValue: true });
    console.log('ScrollY with hero overflow: visible:', s3.result.value);

    ws.close();
    chrome.kill();
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}

testOrbitControlsDisabled();
