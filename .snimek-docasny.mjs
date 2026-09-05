import { chromium } from 'playwright-core';
const A = 'http://localhost:4321/web-za-kninicky/mapa/';
async function spust() {
  for (const k of ['msedge', 'chrome', 'chromium']) {
    try { return await chromium.launch({ channel: k }); } catch {}
  }
  throw new Error('Nenasel jsem prohlizec.');
}
const cil = process.argv[2];
const p = await spust();
const k = await p.newContext({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 2 });
const s = await k.newPage();
await s.goto(A, { waitUntil: 'load' });
await s.waitForTimeout(1600);
await s.locator('.mapa-sekce').screenshot({ path: cil + '/AL1-mapa-v-pasu.png' });
await p.close();
console.log('hotovo');
