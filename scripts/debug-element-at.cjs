const { spawn } = require('child_process');
const http = require('http');

async function debugElementAt() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9227',
    '--window-size=390,844',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9227/json', (r) => {
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
    await send('Runtime.enable');

    const debugInfo = await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.elementFromPoint(195, 400);
        const path = [];
        let curr = el;
        while (curr) {
          path.push({
            tag: curr.tagName,
            id: curr.id,
            className: curr.className,
            touchAction: window.getComputedStyle(curr).touchAction,
            overflow: window.getComputedStyle(curr).overflow,
            overflowY: window.getComputedStyle(curr).overflowY,
            height: window.getComputedStyle(curr).height
          });
          curr = curr.parentElement;
        }

        const bottomBar = document.querySelector("#hero aside");
        const bottomBarInfo = bottomBar ? {
          tag: bottomBar.tagName,
          touchAction: window.getComputedStyle(bottomBar).touchAction,
          rect: bottomBar.getBoundingClientRect()
        } : null;

        return {
          elementFromPoint: el ? el.tagName + '#' + el.id + '.' + el.className : null,
          path,
          bottomBarInfo,
          htmlOverflow: window.getComputedStyle(document.documentElement).overflow,
          bodyOverflow: window.getComputedStyle(document.body).overflow,
          bodyHeight: document.body.scrollHeight,
          windowHeight: window.innerHeight
        };
      })()`,
      returnByValue: true
    });
    console.log('DEBUG INFO:', JSON.stringify(debugInfo.result.value, null, 2));

    ws.close();
    chrome.kill();
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}

debugElementAt();
