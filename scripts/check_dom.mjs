import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\temp\\cqa_dom_' + Date.now();
fs.mkdirSync(USER_DATA_DIR, { recursive: true });

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9225',
  `--user-data-dir=${USER_DATA_DIR}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
], { stdio: 'ignore' });

async function run() {
  await new Promise(r => setTimeout(r, 1000));
  const newTargetRes = await fetch('http://127.0.0.1:9225/json/new?http://localhost:3000', { method: 'PUT' });
  const target = await newTargetRes.json();
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
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data.result);
      callbacks.delete(data.id);
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Log.enable');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.exceptionThrown') {
      console.log('EXCEPTION:', JSON.stringify(data.params.exceptionDetails));
    }
    if (data.method === 'Log.entryAdded') {
      console.log('LOG:', data.params.entry);
    }
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data.result);
      callbacks.delete(data.id);
    }
  };

  await send('Page.navigate', { url: 'http://localhost:3000' });
  await new Promise(r => setTimeout(r, 4000));

  const errorRes = await send('Runtime.evaluate', {
    expression: 'window.errors || document.getElementById("root")?.innerHTML'
  });
  console.log('Root HTML length:', errorRes.result?.value?.length, 'content:', errorRes.result?.value?.slice(0, 300));

  const adminBtnRes = await send('Runtime.evaluate', {
    expression: 'Array.from(document.querySelectorAll("button")).map(b => b.textContent.trim()).filter(Boolean)'
  });
  console.log('Buttons:', adminBtnRes.result?.value);

  ws.close();
  chrome.kill();
  try { fs.rmSync(USER_DATA_DIR, { recursive: true, force: true }); } catch (e) {}
}

run();
