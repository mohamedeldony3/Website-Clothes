const http = require('http');

async function inspect() {
  const targets = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9222/json', (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
  const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('3000'));
  if (!pageTarget) return console.log('No 3000 target');
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
  const res = await send('Runtime.evaluate', {
    expression: `(() => {
      const c = document.querySelector("#hero canvas");
      if (!c) return 'No canvas found';
      return {
        inlineStyle: c.getAttribute("style"),
        computedTouchAction: window.getComputedStyle(c).touchAction,
        parentComputedTouchAction: c.parentElement ? window.getComputedStyle(c.parentElement).touchAction : null,
        heroComputedTouchAction: window.getComputedStyle(document.getElementById("hero")).touchAction
      };
    })()`,
    returnByValue: true
  });
  console.log('CANVAS DETAILS:', res.result.value);
  ws.close();
}
inspect().catch(console.error);
