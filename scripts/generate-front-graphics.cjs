const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const graphics = [
  {
    name: 'chrome-spider-front.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="1024" height="1024">
      <defs>
        <linearGradient id="chrome" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="30%" stop-color="#cccccc"/>
          <stop offset="50%" stop-color="#666666"/>
          <stop offset="70%" stop-color="#e6e6e6"/>
          <stop offset="100%" stop-color="#ffffff"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <!-- Center Body -->
      <circle cx="250" cy="230" r="28" fill="url(#chrome)" filter="url(#glow)"/>
      <ellipse cx="250" cy="300" rx="38" ry="54" fill="url(#chrome)"/>
      <!-- Sharp Spikes / Barb Details -->
      <polygon points="250,180 244,215 256,215" fill="#fff"/>
      <!-- Legs Left -->
      <path d="M 230 220 Q 150 160 120 110 Q 110 95 90 90 Q 120 130 160 190 Q 190 230 226 232" fill="url(#chrome)"/>
      <path d="M 225 240 Q 130 210 90 190 Q 75 180 50 190 Q 80 220 130 245 Q 180 265 220 252" fill="url(#chrome)"/>
      <path d="M 224 265 Q 120 270 80 290 Q 60 300 45 330 Q 75 320 120 295 Q 175 285 222 275" fill="url(#chrome)"/>
      <path d="M 226 295 Q 140 330 110 390 Q 95 420 85 450 Q 120 405 155 360 Q 190 325 228 305" fill="url(#chrome)"/>
      <!-- Legs Right -->
      <path d="M 270 220 Q 350 160 380 110 Q 390 95 410 90 Q 380 130 340 190 Q 310 230 274 232" fill="url(#chrome)"/>
      <path d="M 275 240 Q 370 210 410 190 Q 425 180 450 190 Q 420 220 370 245 Q 320 265 280 252" fill="url(#chrome)"/>
      <path d="M 276 265 Q 380 270 420 290 Q 440 300 455 330 Q 425 320 380 295 Q 325 285 278 275" fill="url(#chrome)"/>
      <path d="M 274 295 Q 360 330 390 390 Q 405 420 415 450 Q 380 405 345 360 Q 310 325 272 305" fill="url(#chrome)"/>
      <!-- Text Badge Below -->
      <text x="250" y="400" font-family="monospace" font-weight="900" font-size="22" fill="#fff" text-anchor="middle" letter-spacing="8">LIQUID CHROME</text>
    </svg>`
  },
  {
    name: 'savage-front.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" width="1200" height="600">
      <defs>
        <filter id="fissure">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      <!-- Distressed Gothic SAVAGE Header -->
      <text x="300" y="160" font-family="Impact, Arial Black, sans-serif" font-weight="900" font-size="110" fill="#f5f5f0" text-anchor="middle" letter-spacing="14" filter="url(#fissure)">SAVAGE</text>
      <!-- Lightning Barbed Line Below -->
      <path d="M 50 190 L 180 190 L 210 175 L 240 205 L 300 190 L 360 205 L 390 175 L 420 190 L 550 190" stroke="#f5f5f0" stroke-width="4" fill="none"/>
      <!-- Sub-label -->
      <text x="300" y="240" font-family="monospace" font-weight="bold" font-size="20" fill="#bbb" text-anchor="middle" letter-spacing="10">GOTHIC METAL // 500 GSM</text>
    </svg>`
  },
  {
    name: 'revelation-front.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="1024" height="1024">
      <!-- Distressed Gothic Cross -->
      <path d="M 235 70 L 265 70 L 265 180 L 375 180 L 375 210 L 265 210 L 265 410 L 235 410 L 235 210 L 125 210 L 125 180 L 235 180 Z" fill="#e8eee5"/>
      <!-- Cross Halo Ring -->
      <circle cx="250" cy="195" r="75" stroke="#e8eee5" stroke-width="4" fill="none" stroke-dasharray="12,6"/>
      <!-- Small Stars -->
      <polygon points="250,45 253,55 263,58 253,61 250,71 247,61 237,58 247,55" fill="#CEFF00"/>
      <!-- Scripture Text -->
      <text x="250" y="450" font-family="monospace" font-weight="bold" font-size="24" fill="#e8eee5" text-anchor="middle" letter-spacing="8">REVELATION 12:9</text>
    </svg>`
  },
  {
    name: 'tokyo-wave-front.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="1024" height="1024">
      <!-- Minimalist Rising Sun -->
      <circle cx="250" cy="220" r="100" fill="#111111" stroke="#f0f0f0" stroke-width="4"/>
      <!-- Kanji Tokyo -->
      <text x="250" y="245" font-family="sans-serif" font-weight="bold" font-size="80" fill="#f0f0f0" text-anchor="middle">東京</text>
      <!-- Wave Line Crest -->
      <path d="M 120 340 Q 180 290 250 340 T 380 340" stroke="#f0f0f0" stroke-width="6" fill="none"/>
      <!-- Typographic border -->
      <text x="250" y="390" font-family="monospace" font-weight="bold" font-size="20" fill="#f0f0f0" text-anchor="middle" letter-spacing="10">TOKYO HERITAGE</text>
    </svg>`
  },
  {
    name: 'one-piece-front.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="1024" height="1024">
      <!-- Vintage Flame Silhouette -->
      <path d="M 250 100 Q 280 180 310 210 Q 350 250 330 310 Q 300 380 250 390 Q 200 380 170 310 Q 150 250 190 210 Q 220 180 250 100 Z" fill="#f5e6d3"/>
      <!-- Inner flame core -->
      <path d="M 250 220 Q 265 260 280 280 Q 290 310 270 340 Q 250 360 230 340 Q 210 310 220 280 Z" fill="#2d221a"/>
      <!-- Cigarette Line Accent -->
      <rect x="220" y="365" width="60" height="6" fill="#f5e6d3"/>
      <!-- Sub-label -->
      <text x="250" y="440" font-family="monospace" font-weight="900" font-size="24" fill="#f5e6d3" text-anchor="middle" letter-spacing="8">SANJI // 03</text>
    </svg>`
  },
  {
    name: 'bare-tree-front.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="1024" height="1024">
      <!-- Stark Winter Tree Silhouette -->
      <path d="M 245 420 L 255 420 L 253 250 L 285 190 L 330 150 M 285 190 L 265 140 M 253 250 L 215 190 L 170 145 M 215 190 L 235 135 M 252 210 L 250 100" stroke="#fcfaf7" stroke-width="7" stroke-linecap="round" fill="none"/>
      <!-- Branch Splinters -->
      <path d="M 310 165 L 340 170 M 275 160 L 290 130 M 190 165 L 160 175 M 225 160 L 210 130" stroke="#fcfaf7" stroke-width="4" stroke-linecap="round" fill="none"/>
      <!-- Typography -->
      <text x="250" y="460" font-family="monospace" font-weight="bold" font-size="22" fill="#fcfaf7" text-anchor="middle" letter-spacing="8">WINTER RESILIENCE</text>
    </svg>`
  },
  {
    name: 'are-you-ok-front.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="1024" height="1024">
      <!-- Two OK Spectacles Hand Circles -->
      <circle cx="185" cy="220" r="55" stroke="#1c1a17" stroke-width="8" fill="#fcfaf7"/>
      <circle cx="315" cy="220" r="55" stroke="#1c1a17" stroke-width="8" fill="#fcfaf7"/>
      <!-- Bridge Wire -->
      <path d="M 240 220 Q 250 205 260 220" stroke="#1c1a17" stroke-width="8" fill="none"/>
      <!-- Inner Eyes / Text -->
      <text x="185" y="232" font-family="Impact, Arial Black" font-size="34" fill="#1c1a17" text-anchor="middle">R</text>
      <text x="315" y="232" font-family="Impact, Arial Black" font-size="34" fill="#1c1a17" text-anchor="middle">U</text>
      <!-- Gold Chain Accent -->
      <path d="M 130 220 Q 110 300 250 330 Q 390 300 370 220" stroke="#D4AF37" stroke-width="5" stroke-dasharray="6,4" fill="none"/>
      <!-- Typography -->
      <text x="250" y="410" font-family="Impact, Arial Black" font-size="44" fill="#1c1a17" text-anchor="middle" letter-spacing="6">ARE YOU OK?</text>
    </svg>`
  },
  {
    name: 'merry-christmas-front.png',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="1024" height="1024">
      <!-- Street Calligraphy Tag -->
      <text x="250" y="230" font-family="Brush Script MT, cursive, sans-serif" font-weight="900" font-size="110" fill="#fbf8f5" text-anchor="middle" transform="rotate(-6, 250, 230)">MONO</text>
      <!-- Drips -->
      <path d="M 180 250 Q 180 290 183 310 M 245 255 Q 243 310 246 335 M 310 250 Q 312 285 310 305" stroke="#fbf8f5" stroke-width="4" stroke-linecap="round"/>
      <circle cx="183" cy="316" r="3" fill="#fbf8f5"/>
      <circle cx="246" cy="342" r="4" fill="#fbf8f5"/>
      <circle cx="310" cy="311" r="3" fill="#fbf8f5"/>
      <!-- Halo motif above -->
      <ellipse cx="250" cy="120" rx="90" ry="24" stroke="#fbf8f5" stroke-width="5" fill="none" transform="rotate(-5, 250, 120)"/>
      <text x="250" y="420" font-family="monospace" font-weight="bold" font-size="20" fill="#fbf8f5" text-anchor="middle" letter-spacing="8">STREET CALLIGRAPHY</text>
    </svg>`
  }
];

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1024,1024',
    '--no-sandbox',
    '--disable-gpu',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const targets = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9222/json', (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });

  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
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
  await send('Emulation.setDefaultBackgroundColorOverride', {
    color: { r: 0, g: 0, b: 0, a: 0 }
  });

  for (const item of graphics) {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; background:transparent; display:flex; align-items:center; justify-content:center; width:1024px; height:1024px; overflow:hidden;">
        ${item.svg}
      </body>
      </html>
    `;
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    await send('Page.navigate', { url: dataUrl });
    await new Promise(r => setTimeout(r, 400));
    const snap = await send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      clip: { x: 0, y: 0, width: 1024, height: 1024, scale: 1 }
    });
    const filePath = `public/graphics/${item.name}`;
    fs.writeFileSync(filePath, Buffer.from(snap.data, 'base64'));
    console.log('Saved:', filePath, 'Size:', fs.statSync(filePath).size);
  }

  ws.close();
  chrome.kill();
  console.log('All 8 front graphics generated successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
