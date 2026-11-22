const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function captureProof() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9240',
    '--window-size=1280,900',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 3500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9240/json', (r) => {
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
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
      hasTouch: false
    });
    await new Promise(r => setTimeout(r, 1000));

    // Scroll to Fitting Lab
    await send('Runtime.evaluate', {
      expression: `(() => {
        const showroom = document.getElementById('fitting-lab') || Array.from(document.querySelectorAll('h2, span, h3')).find(el => el.textContent && (el.textContent.includes('مختبر القياس') || el.textContent.includes('3D FITTING LAB')) || el.textContent.includes('FITTING LAB'))?.closest('section');
        if (showroom) {
          const top = showroom.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top: top - 50, behavior: 'instant' });
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));

    // Capture screenshot of Fitting Lab
    const labShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-fitting-lab-dynamic-options.png', Buffer.from(labShot.data, 'base64'));
    console.log('Saved public/proof-fitting-lab-dynamic-options.png');

    // Mobile Viewport Check (390x844 iPhone 14)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      hasTouch: true
    });
    await new Promise(r => setTimeout(r, 1000));

    // Scroll into customizer in mobile
    await send('Runtime.evaluate', {
      expression: `(() => {
        const customizer = Array.from(document.querySelectorAll('div')).find(d => 
          d.textContent && d.textContent.includes('القصة والقوام') && d.textContent.includes('خامة النسيج')
        );
        if (customizer) {
          const top = customizer.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top: top - 50, behavior: 'instant' });
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    const mobileLabShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-fitting-lab-dynamic-mobile.png', Buffer.from(mobileLabShot.data, 'base64'));
    console.log('Saved public/proof-fitting-lab-dynamic-mobile.png');

    // Copy to brain artifacts
    const brainDir = 'C:\\Users\\Elsony\\.gemini\\antigravity\\brain\\78671bb3-3ccc-407a-acbc-b4a9c1544075';
    fs.copyFileSync('public/proof-fitting-lab-dynamic-options.png', path.join(brainDir, 'proof-fitting-lab-dynamic-options.png'));
    fs.copyFileSync('public/proof-fitting-lab-dynamic-mobile.png', path.join(brainDir, 'proof-fitting-lab-dynamic-mobile.png'));
    console.log('Copied all proofs to brain artifacts directory.');

    ws.close();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

captureProof();
