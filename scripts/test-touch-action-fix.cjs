const { spawn } = require('child_process');
const http = require('http');

async function testTouchActionFix() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9228',
    '--window-size=390,844',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9228/json', (r) => {
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

    // Force touch-action: pan-y !important on all elements in hero
    await send('Runtime.evaluate', {
      expression: `(() => {
        const style = document.createElement('style');
        style.textContent = '#hero, #hero *, #fitting-lab, #fitting-lab * { touch-action: pan-y !important; }';
        document.head.appendChild(style);
      })()`
    });

    // Check path touchAction
    const checkPath = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.elementFromPoint(195, 400);
        const path = [];
        let curr = el;
        while (curr) {
          path.push({
            tag: curr.tagName,
            touchAction: window.getComputedStyle(curr).touchAction
          });
          curr = curr.parentElement;
        }
        return path;
      })()`,
      returnByValue: true
    });
    console.log('CHECK PATH:', JSON.stringify(checkPath.result.value, null, 2));

    console.log('Synthesizing touch scroll with #hero * { touch-action: pan-y !important; }...');
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
    console.log('ScrollY after touch gesture with pan-y on all elements:', scrollPos.result.value);

    ws.close();
    chrome.kill();
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}

testTouchActionFix();
