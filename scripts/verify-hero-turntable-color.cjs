const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function verifyHeroTurntable() {
  console.log('Starting Hero Turntable & True-Color Verification on port 9241...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9241',
    '--window-size=1280,900',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 3500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9241/json', (r) => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => res(JSON.parse(d)));
      }).on('error', rej);
    });

    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('3000'));
    if (!pageTarget) throw new Error('No page target found on port 9241');

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

    // Desktop Viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
      hasTouch: false
    });
    await new Promise(r => setTimeout(r, 2000));

    // Switch to Bare Tree Winter Hoodie (Oxblood Burgundy) to match user's screenshot
    await send('Runtime.evaluate', {
      expression: `(() => {
        // Find bare tree winter hoodie or burgundy color swatch
        const swatches = Array.from(document.querySelectorAll('button')).filter(b => b.title && (b.title.includes('عنابي') || b.title.includes('Burgundy') || b.title.includes('نبيتي')));
        if (swatches.length > 0) {
          swatches[0].click();
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    // Capture angle 1 (Front/quarter rotation)
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-hero-autorotate-angle1.png', Buffer.from(shot1.data, 'base64'));
    console.log('Saved public/proof-hero-autorotate-angle1.png');

    // Wait 3.5s for continuous turntable auto-rotation to rotate to side/back
    await new Promise(r => setTimeout(r, 3500));

    // Capture angle 2 (Profile/side/back rotation)
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-hero-autorotate-angle2.png', Buffer.from(shot2.data, 'base64'));
    console.log('Saved public/proof-hero-autorotate-angle2.png');

    // Test scrolling downward through Hero
    const scrollResult = await send('Runtime.evaluate', {
      expression: `(() => {
        window.scrollBy({ top: 400, behavior: 'instant' });
        return { scrollY: window.scrollY, canScroll: window.scrollY > 0 };
      })()`,
      returnByValue: true
    });
    console.log('Scroll downward test result:', scrollResult.result?.value);
    await new Promise(r => setTimeout(r, 800));

    const shotScroll = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-hero-smooth-scroll.png', Buffer.from(shotScroll.data, 'base64'));
    console.log('Saved public/proof-hero-smooth-scroll.png');

    // Scroll back to top
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0);` });

    // Mobile Viewport Check (390x844 iPhone 14)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true
    });
    await new Promise(r => setTimeout(r, 1500));

    // Capture mobile Hero
    const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-mobile-hero-turntable.png', Buffer.from(shotMobile.data, 'base64'));
    console.log('Saved public/proof-mobile-hero-turntable.png');

    // Test mobile touch scroll
    const mobileScrollResult = await send('Runtime.evaluate', {
      expression: `(() => {
        window.scrollBy({ top: 350, behavior: 'instant' });
        return { scrollY: window.scrollY, canScroll: window.scrollY > 0 };
      })()`,
      returnByValue: true
    });
    console.log('Mobile scroll test result:', mobileScrollResult.result?.value);
    await new Promise(r => setTimeout(r, 800));

    const shotMobileScroll = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-mobile-smooth-scroll.png', Buffer.from(shotMobileScroll.data, 'base64'));
    console.log('Saved public/proof-mobile-smooth-scroll.png');

    // Copy to brain artifacts
    const brainDir = 'C:\\Users\\Elsony\\.gemini\\antigravity\\brain\\78671bb3-3ccc-407a-acbc-b4a9c1544075';
    fs.copyFileSync('public/proof-hero-autorotate-angle1.png', path.join(brainDir, 'proof-hero-autorotate-angle1.png'));
    fs.copyFileSync('public/proof-hero-autorotate-angle2.png', path.join(brainDir, 'proof-hero-autorotate-angle2.png'));
    fs.copyFileSync('public/proof-hero-smooth-scroll.png', path.join(brainDir, 'proof-hero-smooth-scroll.png'));
    fs.copyFileSync('public/proof-mobile-hero-turntable.png', path.join(brainDir, 'proof-mobile-hero-turntable.png'));
    fs.copyFileSync('public/proof-mobile-smooth-scroll.png', path.join(brainDir, 'proof-mobile-smooth-scroll.png'));
    console.log('Copied all proofs to brain directory.');

    ws.close();
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

verifyHeroTurntable();
