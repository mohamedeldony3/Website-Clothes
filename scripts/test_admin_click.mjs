import { spawn } from 'child_process';

const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9232',
  '--user-data-dir=C:\\temp\\cqa_test_eval4',
  '--window-size=1440,1080',
  'about:blank'
]);

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9232/json/new?http://localhost:3000', { method: 'PUT' });
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
        console.error('EXCEPTION:', d.params.exceptionDetails);
      }
      if (d.id && callbacks.has(d.id)) {
        callbacks.get(d.id)(d.result);
        callbacks.delete(d.id);
      }
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await new Promise(r => setTimeout(r, 4000));

    // Find and click the Admin button
    const clickRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('ADMIN'));
          if (btn) {
            btn.click();
            return { clicked: true, text: btn.textContent };
          }
          return { clicked: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Click res:', clickRes.result.value);

    await new Promise(r => setTimeout(r, 1000));

    const checkDom = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const modals = Array.from(document.querySelectorAll('div[class*="fixed"]')).map(d => d.className);
          const hasPinInput = !!document.querySelector('input[type="password"]');
          const inputs = Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, placeholder: i.placeholder, className: i.className }));
          return {
            hasPinInput,
            inputs,
            modalsCount: modals.length,
            bodyText: document.body.innerText.slice(0, 600)
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Check DOM after click:', JSON.stringify(checkDom.result.value, null, 2));

    ws.close();
    chrome.kill();
    process.exit(0);
  } catch (e) {
    console.error(e);
    chrome.kill();
    process.exit(1);
  }
}, 1000);
