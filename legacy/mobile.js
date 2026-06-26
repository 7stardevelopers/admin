const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: '/opt/google/chrome/chrome', headless: 'new',
    args: ['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await p.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
  const j = await p.evaluate(() => { const j = document.getElementById('journey'); return { top: j.offsetTop, h: j.offsetHeight }; });
  await p.evaluate(y => { scrollTo(0, y); ScrollTrigger.update(); }, j.top + (j.h - 844) * 0.375);
  await new Promise(r => setTimeout(r, 300));
  await p.evaluate(() => ScrollTrigger.update());
  await p.waitForFunction(() => Math.abs(window.__vectr.target() - window.__vectr.progress()) < 0.004, { timeout: 30000, polling: 200 });
  await p.screenshot({ path: 'shots/mobile_step2.png' });
  console.log('mobile errors:', errs.length ? errs : 'none');
  await b.close();
})();
