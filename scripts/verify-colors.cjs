const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

async function verifyColors() {
  console.log('Testing and capturing true color rendering on port 9243...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9243',
    '--window-size=1280,900',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 3500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9243/json', (r) => {
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

    // Reset localstorage mono_products to ensure fresh calibrated palette
    await send('Runtime.evaluate', {
      expression: `(() => {
        localStorage.removeItem('mono_products');
        location.reload();
      })()`
    });
    await new Promise(r => setTimeout(r, 2500));

    // Scroll directly to Fitting Lab
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('fitting-lab');
        if (el) {
          const pos = el.getBoundingClientRect().top + window.pageYOffset - 50;
          window.scrollTo({ top: pos, behavior: 'instant' });
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    // 1. Click Revelation Falling Angel hoodie thumbnail in gallery
    const revClick = await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('#fitting-lab button'));
        const revBtn = buttons.find(b => b.textContent && (b.textContent.includes('ريفيليشن') || b.textContent.includes('REVELATION')));
        if (revBtn) {
          revBtn.click();
          return 'clicked revelation thumbnail';
        }
        return 'rev button not found';
      })()`,
      returnByValue: true
    });
    console.log('Rev click:', revClick.result?.value);
    await new Promise(r => setTimeout(r, 1500));

    // Capture initial state (Forest Emerald Pine)
    const greenScreen = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-color-revelation-green.png', Buffer.from(greenScreen.data, 'base64'));
    console.log('Saved public/proof-color-revelation-green.png');

    // 2. Click Acid Moss Olive swatch
    const oliveClick = await send('Runtime.evaluate', {
      expression: `(() => {
        const swatches = Array.from(document.querySelectorAll('#fitting-lab button[title]'));
        const olive = swatches.find(s => s.getAttribute('title').includes('زيتي') || s.getAttribute('title').includes('Acid Moss') || s.getAttribute('title').includes('4A5636') || s.getAttribute('title').includes('373A32'));
        if (olive) {
          olive.click();
          return 'clicked olive: ' + olive.getAttribute('title');
        }
        return 'olive not found. Swatches: ' + swatches.map(s => s.getAttribute('title')).join(', ');
      })()`,
      returnByValue: true
    });
    console.log('Olive click:', oliveClick.result?.value);
    await new Promise(r => setTimeout(r, 1500));

    // Capture Acid Moss Olive
    const oliveScreen = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-color-revelation-olive.png', Buffer.from(oliveScreen.data, 'base64'));
    console.log('Saved public/proof-color-revelation-olive.png');

    // 3. Click Savage Gothic hoodie thumbnail (Chocolate Brown)
    const savageClick = await send('Runtime.evaluate', {
      expression: `(() => {
        const buttons = Array.from(document.querySelectorAll('#fitting-lab button'));
        const savageBtn = buttons.find(b => b.textContent && (b.textContent.includes('سافاج') || b.textContent.includes('SAVAGE')));
        if (savageBtn) {
          savageBtn.click();
          return 'clicked savage thumbnail';
        }
        return 'savage button not found';
      })()`,
      returnByValue: true
    });
    console.log('Savage click:', savageClick.result?.value);
    await new Promise(r => setTimeout(r, 1500));

    // Capture Savage Chocolate Brown
    const brownScreen = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-color-savage-brown.png', Buffer.from(brownScreen.data, 'base64'));
    console.log('Saved public/proof-color-savage-brown.png');

    console.log('All color proofs captured successfully!');
  } finally {
    try { chrome.kill(); } catch {}
  }
}

verifyColors();
