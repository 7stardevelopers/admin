const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/opt/google/chrome/chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader',
           '--enable-unsafe-swiftshader', '--window-size=1440,900'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  const webgl = await page.evaluate(() => {
    const c = document.querySelector('#stage canvas');
    return !!(c && (c.getContext('webgl2') || c.getContext('webgl')));
  });

  const total = await page.evaluate(() => document.body.scrollHeight - innerHeight);
  const journey = await page.evaluate(() => {
    const j = document.getElementById('journey');
    return { top: j.offsetTop, height: j.offsetHeight };
  });

  // sample at the exact progress centers of each card window
  const range = journey.height - 900; // ScrollTrigger start..end span
  const atP = p => journey.top + p * range;
  const samples = [
    ['00_hero', 0],
    ['01_step1', atP(0.125)],
    ['02_step2', atP(0.375)],
    ['03_step3', atP(0.625)],
    ['04_step4', atP(0.875)],
    ['05_outro', total],
  ];

  const report = [];
  for (const [name, y] of samples) {
    await page.evaluate(v => { scrollTo(0, v); ScrollTrigger.update(); }, y);
    await new Promise(r => setTimeout(r, 300));
    await page.evaluate(() => ScrollTrigger.update());
    await page.waitForFunction(
      () => Math.abs(window.__vectr.target() - window.__vectr.progress()) < 0.004,
      { timeout: 30000, polling: 200 });
    const state = await page.evaluate(() => ({
      progress: +window.__vectr.progress().toFixed(3), target: +window.__vectr.target().toFixed(3),
      cam: window.__vectr.cameraPos().map(n => +n.toFixed(1)),
      cards: [...document.querySelectorAll('.step')].map(s => +getComputedStyle(s).opacity).map(o => +o.toFixed(2)),
    }));
    await page.screenshot({ path: `/home/claude/vectr-scroll/shots/${name}.png` });
    report.push({ name, scrollY: Math.round(y), ...state });
  }

  console.log('WebGL context:', webgl);
  console.log('Console/page errors:', errors.length ? errors : 'none');
  console.table ? console.table(report) : console.log(report);
  console.log(JSON.stringify(report, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
