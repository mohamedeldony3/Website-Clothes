import { spawn } from 'child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9231',
  '--user-data-dir=C:\\temp\\cqa_test_eval3',
  '--window-size=1440,1080',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9231/json/new?http://localhost:3000', { method: 'PUT' });
    const target = await res.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 1;
    const callbacks = new Map();
    function send(method, params = {}) {
      return new Promise((resolve) => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await new Promise(r => ws.onopen = r);
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.method === 'Runtime.consoleAPICalled') {
        console.log('CONSOLE:', d.params.type, d.params.args.map(a => a.value || a.description).join(' '));
      }
      if (d.method === 'Runtime.exceptionThrown') {
        console.error('EXCEPTION:', d.params.exceptionDetails.text, d.params.exceptionDetails.exception?.description);
      }
      if (d.id && callbacks.has(d.id)) {
        callbacks.get(d.id)(d.result);
        callbacks.delete(d.id);
      }
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await new Promise(r => setTimeout(r, 4000));

    const check = await send('Runtime.evaluate', {
      expression: `
        (() => {
          return {
            text: document.body.innerText.slice(0, 400),
            html: document.body.innerHTML.slice(0, 400),
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Check result:', check.result.value);

    ws.close();
    chrome.kill();
    process.exit(0);
  } catch (e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 1000);
