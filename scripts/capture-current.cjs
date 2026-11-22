const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Desktop
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'public/current-desktop-hero.png' });
  
  // Fitting Lab desktop
  await page.evaluate(() => {
    const el = document.getElementById('fitting-lab');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'public/current-desktop-lab.png' });

  // Mobile
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'public/current-mobile-hero.png' });

  await page.evaluate(() => {
    const el = document.getElementById('fitting-lab');
    if (el) el.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'public/current-mobile-lab.png' });

  await browser.close();
  console.log('Done capturing current state!');
})();
