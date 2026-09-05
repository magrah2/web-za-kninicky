import { chromium } from 'playwright-core';
const A = 'http://localhost:4321/web-za-kninicky/';
async function spust() {
  for (const k of ['msedge', 'chrome', 'chromium']) {
    try { return await chromium.launch({ channel: k }); } catch {}
  }
  throw new Error('Nenasel jsem prohlizec.');
}
const cil = process.argv[2];
const p = await spust();
const k = await p.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
const s = await k.newPage();
const chyby = [];
s.on('requestfailed', (r) => chyby.push('nenacteno: ' + r.url()));
await s.goto(`${A}program/`, { waitUntil: 'load' });
await s.waitForTimeout(900);
console.log('tlacitka "Chci vedet vic": ' + await s.locator('text=Chci vědět víc').count());
await s.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 1500));
await s.waitForTimeout(400);
await s.screenshot({ path: cil + '/AJ1-program-konec.png' });
await s.goto(`${A}kontakt/`, { waitUntil: 'load' });
await s.waitForTimeout(700);
await s.screenshot({ path: cil + '/AJ2-kontakt.png' });
console.log('stara stranka rozpisu: ' + (await s.goto(`${A}program/placeholder/`)).status());
await p.close();
console.log(chyby.length ? chyby.join('\n') : 'bez chyb');
