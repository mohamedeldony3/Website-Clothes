const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function runVerification() {
  console.log('Starting headless Chrome for verification...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--window-size=390,844',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9223/json', (r) => {
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

    // 1. Mobile setup (iPhone 14 / 390x844)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await new Promise(r => setTimeout(r, 3000));

    // Verify touch action and scroll pill on Hero
    const heroAudit = await send('Runtime.evaluate', {
      expression: `(() => {
        const hero = document.getElementById('hero');
        const canvas = hero.querySelector('canvas');
        const scrollBtn = Array.from(hero.querySelectorAll('button')).find(b => 
          b.textContent.includes('انزل لتصفح') || b.textContent.includes('SCROLL DOWN')
        );
        return {
          hasScrollBtn: !!scrollBtn,
          scrollBtnText: scrollBtn ? scrollBtn.textContent.trim() : null,
          canvasTouchAction: canvas ? window.getComputedStyle(canvas).touchAction : null,
          containerTouchAction: canvas && canvas.parentElement ? window.getComputedStyle(canvas.parentElement).touchAction : null,
          initialScrollY: window.scrollY
        };
      })()`,
      returnByValue: true
    });
    console.log('HERO AUDIT:', JSON.stringify(heroAudit.result.value, null, 2));

    // Take screenshot of Mobile Hero with enlarged hoodie and scroll pill
    const heroShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-hero-with-scroll-pill.png', Buffer.from(heroShot.data, 'base64'));
    console.log('Captured: public/proof-hero-with-scroll-pill.png');

    // Test clicking the Scroll Down Button
    const clickTest = await send('Runtime.evaluate', {
      expression: `(() => {
        const hero = document.getElementById('hero');
        const scrollBtn = Array.from(hero.querySelectorAll('button')).find(b => 
          b.textContent.includes('انزل لتصفح') || b.textContent.includes('SCROLL DOWN')
        );
        if (scrollBtn) {
          scrollBtn.click();
          return true;
        }
        return false;
      })()`,
      returnByValue: true
    });
    console.log('Clicked scroll button:', clickTest.result.value);

    await new Promise(r => setTimeout(r, 1500));

    const afterScroll = await send('Runtime.evaluate', {
      expression: `window.scrollY`,
      returnByValue: true
    });
    console.log('window.scrollY after clicking Scroll Down button:', afterScroll.result.value);

    // 2. Test Fitting Lab on Mobile (scroll to it and wait for 3D load)
    await send('Runtime.evaluate', {
      expression: `(() => {
        const lab = document.getElementById('fitting-lab');
        if (lab) lab.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });

    await new Promise(r => setTimeout(r, 3000));

    const labAudit = await send('Runtime.evaluate', {
      expression: `(() => {
        const lab = document.getElementById('fitting-lab');
        const stage = lab.querySelector('.lg\\\\:col-span-8');
        return {
          stageHeight: stage ? stage.getBoundingClientRect().height : 0,
          stageWidth: stage ? stage.getBoundingClientRect().width : 0,
          scrollY: window.scrollY
        };
      })()`,
      returnByValue: true
    });
    console.log('LAB AUDIT (Mobile):', JSON.stringify(labAudit.result.value, null, 2));

    const labMobileShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-enlarged-fitting-lab-mobile.png', Buffer.from(labMobileShot.data, 'base64'));
    console.log('Captured: public/proof-enlarged-fitting-lab-mobile.png');

    // 3. Desktop Fitting Lab test (1440x900)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Runtime.evaluate', {
      expression: `(() => {
        const lab = document.getElementById('fitting-lab');
        if (lab) lab.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });

    await new Promise(r => setTimeout(r, 3000));

    const labDesktopShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-enlarged-fitting-lab-desktop.png', Buffer.from(labDesktopShot.data, 'base64'));
    console.log('Captured: public/proof-enlarged-fitting-lab-desktop.png');

    // Copy to brain artifacts dir
    const brainDir = 'C:\\Users\\Elsony\\.gemini\\antigravity\\brain\\78671bb3-3ccc-407a-acbc-b4a9c1544075';
    ['proof-hero-with-scroll-pill.png', 'proof-enlarged-fitting-lab-mobile.png', 'proof-enlarged-fitting-lab-desktop.png'].forEach(file => {
      fs.copyFileSync(path.join('public', file), path.join(brainDir, file));
      console.log(`Copied ${file} to artifacts directory.`);
    });

    ws.close();
    chrome.kill();
    console.log('Verification completed successfully!');
  } catch (err) {
    console.error('Verification error:', err);
    chrome.kill();
  }
}

runVerification();
