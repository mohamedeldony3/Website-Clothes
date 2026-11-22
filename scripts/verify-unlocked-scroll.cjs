const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function verify() {
  console.log('Testing unlocked scroll on mobile...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9231',
    '--window-size=390,844',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9231/json', (r) => {
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

    await new Promise(r => setTimeout(r, 2500));

    // Audit default state: canvas should be pointer-events: none on mobile so scrolling works anywhere
    const stateAudit = await send('Runtime.evaluate', {
      expression: `(() => {
        const c = document.querySelector("#hero canvas");
        const cWrap = document.querySelector("#hero .absolute.inset-0.z-0");
        const rotateBtn = Array.from(document.querySelectorAll("#hero button")).find(b => b.textContent.includes("360°"));
        return {
          canvasPointerEvents: c ? window.getComputedStyle(c).pointerEvents : null,
          canvasWrapPointerEvents: cWrap ? window.getComputedStyle(cWrap).pointerEvents : null,
          hasRotateBtn: !!rotateBtn
        };
      })()`,
      returnByValue: true
    });
    console.log('MOBILE STATE AUDIT:', JSON.stringify(stateAudit.result.value, null, 2));

    // Capture screenshot of unlocked Hero
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-mobile-unlocked-hero.png', Buffer.from(shot1.data, 'base64'));
    console.log('Captured: public/proof-mobile-unlocked-hero.png');

    // Click 360° button to activate 3D interaction mode
    await send('Runtime.evaluate', {
      expression: `(() => {
        const rotateBtn = Array.from(document.querySelectorAll("#hero button")).find(b => b.textContent.includes("360°"));
        if (rotateBtn) rotateBtn.click();
      })()`
    });

    await new Promise(r => setTimeout(r, 1000));

    const activeAudit = await send('Runtime.evaluate', {
      expression: `(() => {
        const c = document.querySelector("#hero canvas");
        const badge = Array.from(document.querySelectorAll("#hero div")).find(d => 
          d.textContent.includes("وضع تدوير 3D") || d.textContent.includes("3D ROTATE ACTIVE")
        );
        return {
          canvasPointerEventsAfter360: c ? window.getComputedStyle(c).pointerEvents : null,
          hasActiveBadge: !!badge,
          badgeText: badge ? badge.textContent.trim() : null
        };
      })()`,
      returnByValue: true
    });
    console.log('ACTIVE 360 AUDIT:', JSON.stringify(activeAudit.result.value, null, 2));

    // Capture screenshot of 360° Active Mode
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-mobile-360-active.png', Buffer.from(shot2.data, 'base64'));
    console.log('Captured: public/proof-mobile-360-active.png');

    // Copy to brain artifacts
    const brainDir = 'C:\\Users\\Elsony\\.gemini\\antigravity\\brain\\78671bb3-3ccc-407a-acbc-b4a9c1544075';
    ['proof-mobile-unlocked-hero.png', 'proof-mobile-360-active.png'].forEach(f => {
      fs.copyFileSync(path.join('public', f), path.join(brainDir, f));
      console.log(`Copied ${f} to artifacts directory.`);
    });

    ws.close();
    chrome.kill();
    console.log('Verification finished successfully!');
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}

verify();
