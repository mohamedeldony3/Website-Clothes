const { spawn } = require('child_process');
const http = require('http');

async function testScrollMechanism() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9230',
    '--window-size=390,844',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9230/json', (r) => {
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
      mobile: true,
      hasTouch: true
    });

    await new Promise(r => setTimeout(r, 2000));

    // Check document scrollingElement
    const docInfo = await send('Runtime.evaluate', {
      expression: `(() => {
        return {
          scrollingElement: document.scrollingElement.tagName,
          scrollTop: document.scrollingElement.scrollTop,
          scrollHeight: document.scrollingElement.scrollHeight,
          clientHeight: document.scrollingElement.clientHeight,
          canScroll: document.scrollingElement.scrollHeight > document.scrollingElement.clientHeight
        };
      })()`,
      returnByValue: true
    });
    console.log('DOC INFO:', docInfo.result.value);

    // Test mouse wheel scroll
    await send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: 195,
      y: 400,
      deltaX: 0,
      deltaY: 300
    });
    await new Promise(r => setTimeout(r, 500));
    const sWheel = await send('Runtime.evaluate', { expression: `window.scrollY`, returnByValue: true });
    console.log('ScrollY after mouseWheel at 195,400:', sWheel.result.value);

    ws.close();
    chrome.kill();
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}

testScrollMechanism();
