const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function testTimeout() {
  console.log('Testing 360 auto-timeout and auto-spin...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9232',
    '--window-size=390,844',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9232/json', (r) => {
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

    // 1. Click 360° button to activate
    console.log('Clicking 360° button...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll("#hero button")).find(b => b.textContent.includes("360°"));
        if (btn) btn.click();
      })()`
    });

    await new Promise(r => setTimeout(r, 600));

    // Check active badge and state
    const activeCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const badge = Array.from(document.querySelectorAll("#hero div")).find(d => 
          d.textContent.includes("AUTO-SPIN") || d.textContent.includes("تلقائي")
        );
        const heroHasClass = document.getElementById("hero").classList.contains("is-3d-active");
        return {
          hasBadge: !!badge,
          badgeText: badge ? badge.textContent.trim() : null,
          heroHasClass
        };
      })()`,
      returnByValue: true
    });
    console.log('ACTIVE CHECK:', JSON.stringify(activeCheck.result.value, null, 2));

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-360-autospin-badge.png', Buffer.from(shot1.data, 'base64'));
    console.log('Captured: public/proof-360-autospin-badge.png');

    // 2. Wait for 6.5 seconds for the auto-timeout to expire
    console.log('Waiting 6.5s for inactivity timer to auto-exit...');
    await new Promise(r => setTimeout(r, 6500));

    // Check that is-3d-active is gone and badge is gone
    const timeoutCheck = await send('Runtime.evaluate', {
      expression: `(() => {
        const badge = Array.from(document.querySelectorAll("#hero div")).find(d => 
          d.textContent.includes("AUTO-SPIN") || d.textContent.includes("تلقائي")
        );
        const heroHasClass = document.getElementById("hero").classList.contains("is-3d-active");
        const canvas = document.querySelector("#hero canvas");
        return {
          hasBadge: !!badge,
          heroHasClass,
          canvasPointerEvents: canvas ? window.getComputedStyle(canvas).pointerEvents : null
        };
      })()`,
      returnByValue: true
    });
    console.log('TIMEOUT CHECK (after 6.5s):', JSON.stringify(timeoutCheck.result.value, null, 2));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-360-auto-exited.png', Buffer.from(shot2.data, 'base64'));
    console.log('Captured: public/proof-360-auto-exited.png');

    // Copy to brain artifacts
    const brainDir = 'C:\\Users\\Elsony\\.gemini\\antigravity\\brain\\78671bb3-3ccc-407a-acbc-b4a9c1544075';
    ['proof-360-autospin-badge.png', 'proof-360-auto-exited.png'].forEach(f => {
      fs.copyFileSync(path.join('public', f), path.join(brainDir, f));
      console.log(`Copied ${f} to artifacts directory.`);
    });

    ws.close();
    chrome.kill();
    console.log('Auto-timeout & auto-spin test finished successfully!');
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}

testTimeout();
