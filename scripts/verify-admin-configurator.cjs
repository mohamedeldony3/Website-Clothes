const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

async function verifyAdminConfigurator() {
  console.log('Starting 3D Configurator Verification on port 9239...');
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9239',
    '--window-size=1280,900',
    '--no-sandbox',
    '--disable-gpu',
    'http://localhost:3000'
  ]);

  await new Promise(r => setTimeout(r, 3500));

  try {
    const targets = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9239/json', (r) => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => res(JSON.parse(d)));
      }).on('error', rej);
    });

    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('3000'));
    if (!pageTarget) throw new Error('No page target found on port 9239');

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

    // Desktop Admin Viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
      hasTouch: false
    });
    await new Promise(r => setTimeout(r, 1000));

    // Authenticate via sessionStorage and reload page to activate authenticated state
    await send('Runtime.evaluate', {
      expression: `(() => {
        sessionStorage.setItem('mono_admin_auth', 'true');
        location.reload();
      })()`
    });
    await new Promise(r => setTimeout(r, 2500));

    // Open Admin Command Center via Alt+A shortcut
    const openAdminRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const ev = new KeyboardEvent('keydown', { key: 'a', altKey: true, bubbles: true });
        window.dispatchEvent(ev);
        return { dispatched: true };
      })()`,
      returnByValue: true
    });
    console.log('Open admin result:', openAdminRes.result?.value);
    await new Promise(r => setTimeout(r, 1500));

    // Switch to PRODUCTS VAULT tab in Admin Dashboard
    const switchTabRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const tabs = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('PRODUCTS VAULT'));
        if (tabs.length > 0) {
          tabs[0].click();
          return { found: true, text: tabs[0].textContent };
        }
        return { found: false };
      })()`,
      returnByValue: true
    });
    console.log('Switch tab result:', switchTabRes.result?.value);
    await new Promise(r => setTimeout(r, 1000));

    // Click EDIT on the first piece
    const editProductRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const editBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && (b.textContent.includes('EDIT') || b.textContent.includes('تعديل')));
        if (editBtns.length > 0) {
          editBtns[0].click();
          return { opened: true, count: editBtns.length };
        }
        return { opened: false };
      })()`,
      returnByValue: true
    });
    console.log('Edit product modal open result:', editProductRes.result?.value);
    await new Promise(r => setTimeout(r, 1200));

    // Switch to Tab 5: "5. 3D CONFIGURATOR (خيارات معمل 3D)"
    const switch3DTabRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const tab3D = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('3D CONFIGURATOR') || b.textContent.includes('معمل 3D')));
        if (tab3D) {
          tab3D.click();
          return { clicked: true, text: tab3D.textContent };
        }
        return { clicked: false };
      })()`,
      returnByValue: true
    });
    console.log('Switch to 3D tab result:', switch3DTabRes.result?.value);
    await new Promise(r => setTimeout(r, 1200));

    // Capture proof of Admin Configurator Tab
    const adminConfigShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-admin-configurator-tab.png', Buffer.from(adminConfigShot.data, 'base64'));
    console.log('Saved public/proof-admin-configurator-tab.png');

    // In the 3D Configurator, toggle OFF CROPPED fit and toggle OFF NYLON finish
    const toggleOptionsRes = await send('Runtime.evaluate', {
      expression: `(() => {
        let toggledCropped = false;
        let toggledNylon = false;

        const allButtons = Array.from(document.querySelectorAll('button'));
        for (const btn of allButtons) {
          const parent = btn.closest('div.p-3\\.5') || btn.parentElement?.parentElement;
          if (parent && parent.textContent.includes('CROPPED') && btn.textContent.includes('مفعّل')) {
            btn.click();
            toggledCropped = true;
          }
          if (parent && parent.textContent.includes('NYLON') && btn.textContent.includes('مفعّل')) {
            btn.click();
            toggledNylon = true;
          }
        }
        return { toggledCropped, toggledNylon };
      })()`,
      returnByValue: true
    });
    console.log('Toggled options result:', toggleOptionsRes.result?.value);
    await new Promise(r => setTimeout(r, 1000));

    // Save product changes
    const saveRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('SAVE CHANGES'));
        if (saveBtn) {
          saveBtn.click();
          return { clicked: true };
        }
        return { clicked: false };
      })()`,
      returnByValue: true
    });
    console.log('Saved product changes result:', saveRes.result?.value);
    await new Promise(r => setTimeout(r, 1500));

    // Close admin dashboard
    await send('Runtime.evaluate', {
      expression: `(() => {
        const closeAdmin = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('BACK TO ATELIER STORE') || b.textContent.includes('العودة للمتجر')));
        if (closeAdmin) closeAdmin.click();
        else {
          // Alt+A again toggles it off or Escape
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', altKey: true, bubbles: true }));
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1200));

    // Scroll to Fitting Lab
    await send('Runtime.evaluate', {
      expression: `(() => {
        const showroom = document.getElementById('fitting-lab') || Array.from(document.querySelectorAll('h2, span, h3')).find(el => el.textContent && (el.textContent.includes('مختبر القياس') || el.textContent.includes('3D FITTING LAB')) || el.textContent.includes('FITTING LAB'))?.closest('section');
        if (showroom) {
          const top = showroom.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top: top - 50, behavior: 'instant' });
          return { scrolled: true, top };
        }
        return { scrolled: false };
      })()`,
      returnByValue: true
    });
    await new Promise(r => setTimeout(r, 2000));

    // Inspect available buttons in fitting lab
    const fittingLabStateRes = await send('Runtime.evaluate', {
      expression: `(() => {
        // Collect buttons inside fitting lab right customizer panel
        const customizerPanel = Array.from(document.querySelectorAll('div')).find(d => 
          (d.textContent.includes('القصة والقوام') || d.textContent.includes('SILHOUETTE')) &&
          (d.textContent.includes('خامة النسيج') || d.textContent.includes('FABRIC FINISH'))
        );
        if (!customizerPanel) return { error: 'No customizer panel found' };

        // Fit buttons
        const fitRow = Array.from(customizerPanel.querySelectorAll('div')).find(d => d.textContent.includes('القصة والقوام') || d.textContent.includes('SILHOUETTE'));
        const fitParent = fitRow?.parentElement;
        const fitButtons = fitParent ? Array.from(fitParent.querySelectorAll('button')).map(b => b.textContent.trim()) : [];

        // Finish buttons
        const finishRow = Array.from(customizerPanel.querySelectorAll('div')).find(d => d.textContent.includes('خامة النسيج') || d.textContent.includes('FABRIC FINISH'));
        const finishParent = finishRow?.parentElement;
        const finishButtons = finishParent ? Array.from(finishParent.querySelectorAll('button')).map(b => b.textContent.trim()) : [];

        // Lighting buttons
        const lightRow = Array.from(customizerPanel.querySelectorAll('div')).find(d => d.textContent.includes('إضاءة الاستوديو') || d.textContent.includes('STUDIO LIGHTING'));
        const lightParent = lightRow?.parentElement;
        const lightButtons = lightParent ? Array.from(lightParent.querySelectorAll('button')).map(b => b.textContent.trim()) : [];

        return { fitButtons, finishButtons, lightButtons };
      })()`,
      returnByValue: true
    });
    console.log('Fitting Lab dynamically rendered buttons:', fittingLabStateRes.result?.value);

    // Capture screenshot of Fitting Lab with dynamically customized options
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

    // Scroll into view on mobile
    await send('Runtime.evaluate', {
      expression: `(() => {
        const customizer = Array.from(document.querySelectorAll('div')).find(d => 
          d.textContent && d.textContent.includes('القصة والقوام') && d.textContent.includes('خامة النسيج')
        );
        if (customizer) {
          const top = customizer.getBoundingClientRect().top + window.pageYOffset;
          window.scrollTo({ top: top - 80, behavior: 'instant' });
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));

    const mobileLabShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('public/proof-fitting-lab-dynamic-mobile.png', Buffer.from(mobileLabShot.data, 'base64'));
    console.log('Saved public/proof-fitting-lab-dynamic-mobile.png');

    // Copy to brain artifacts
    const brainDir = 'C:\\Users\\Elsony\\.gemini\\antigravity\\brain\\78671bb3-3ccc-407a-acbc-b4a9c1544075';
    fs.copyFileSync('public/proof-admin-configurator-tab.png', path.join(brainDir, 'proof-admin-configurator-tab.png'));
    fs.copyFileSync('public/proof-fitting-lab-dynamic-options.png', path.join(brainDir, 'proof-fitting-lab-dynamic-options.png'));
    fs.copyFileSync('public/proof-fitting-lab-dynamic-mobile.png', path.join(brainDir, 'proof-fitting-lab-dynamic-mobile.png'));
    console.log('Copied all proofs to brain artifacts directory.');

    ws.close();
  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

verifyAdminConfigurator();
