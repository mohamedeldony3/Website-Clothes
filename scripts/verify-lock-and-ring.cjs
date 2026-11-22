const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function testLockAndRing() {
  console.log('Testing Lock Mode and Radial Countdown Ring...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9233',
    '--window-size=390,844',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 3500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9233/json', (r) => {
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

    // 1. Single click on 360° button to activate timed mode with radial ring
    console.log('Activating 360° timed mode with radial countdown ring...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll("#hero button")).find(b => b.textContent.includes("360°"));
        if (btn) btn.click();
      })()`
    });

    await new Promise(r => setTimeout(r, 800));

    const timedAudit = await send('Runtime.evaluate', {
      expression: `(() => {
        const ring = document.querySelector("#hero svg.animate-radial-countdown, #hero circle.animate-radial-countdown");
        const badge = Array.from(document.querySelectorAll("#hero div")).find(d => 
          d.textContent.includes("AUTO-SPIN") || d.textContent.includes("تلقائي")
        );
        return {
          hasRing: !!ring,
          badgeText: badge ? badge.textContent.trim() : null
        };
      })()`,
      returnByValue: true
    });
    console.log('TIMED AUDIT:', JSON.stringify(timedAudit.result.value, null, 2));

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-timed-ring.png', Buffer.from(shot1.data, 'base64'));
    console.log('Captured: public/proof-timed-ring.png');

    // 2. Click the "LOCK" button in badge or double tap 360° to enter Lock Mode
    console.log('Activating Lock Mode (تثبيت وضع الاستعراض)...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const lockBtn = Array.from(document.querySelectorAll("#hero button")).find(b => 
          b.textContent.includes("LOCK") || b.textContent.includes("تثبيت")
        );
        if (lockBtn) lockBtn.click();
      })()`
    });

    await new Promise(r => setTimeout(r, 800));

    const lockAudit = await send('Runtime.evaluate', {
      expression: `(() => {
        const badge = Array.from(document.querySelectorAll("#hero div")).find(d => 
          d.textContent.includes("LOCKED") || d.textContent.includes("مُثبّت")
        );
        const lockBtnOnPill = Array.from(document.querySelectorAll("#hero button")).find(b => 
          b.textContent.includes("LOCKED") || b.textContent.includes("مُثبت")
        );
        return {
          hasLockedBadge: !!badge,
          badgeText: badge ? badge.textContent.trim() : null,
          hasLockedBtnOnPill: !!lockBtnOnPill,
          pillBtnText: lockBtnOnPill ? lockBtnOnPill.textContent.trim() : null
        };
      })()`,
      returnByValue: true
    });
    console.log('LOCK AUDIT:', JSON.stringify(lockAudit.result.value, null, 2));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-locked-mode.png', Buffer.from(shot2.data, 'base64'));
    console.log('Captured: public/proof-locked-mode.png');

    // 3. Verify it does NOT auto-exit after 7 seconds when locked
    console.log('Waiting 7s to verify it stays locked indefinitely...');
    await new Promise(r => setTimeout(r, 7000));

    const stillLockedAudit = await send('Runtime.evaluate', {
      expression: `(() => {
        const hero = document.getElementById("hero");
        const canvas = hero.querySelector("canvas");
        return {
          heroIs3DActive: hero.classList.contains("is-3d-active"),
          canvasPointerEvents: canvas ? window.getComputedStyle(canvas).pointerEvents : null
        };
      })()`,
      returnByValue: true
    });
    console.log('STILL LOCKED AUDIT (after 7s):', JSON.stringify(stillLockedAudit.result.value, null, 2));

    // Copy proofs to brain artifacts
    const brainDir = 'C:\\Users\\Elsony\\.gemini\\antigravity\\brain\\78671bb3-3ccc-407a-acbc-b4a9c1544075';
    ['proof-timed-ring.png', 'proof-locked-mode.png'].forEach(f => {
      fs.copyFileSync(path.join('public', f), path.join(brainDir, f));
      console.log(`Copied ${f} to artifacts directory.`);
    });

    ws.close();
    chrome.kill();
    console.log('Lock and ring verification finished successfully!');
  } catch (err) {
    console.error(err);
    chrome.kill();
  }
}

testLockAndRing();
