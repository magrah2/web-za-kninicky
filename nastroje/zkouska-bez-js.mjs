/**
 * Zkouska, ze web funguje bez JavaScriptu:  npm run zkouska-bez-js
 *
 * „Bez JavaScriptu web funguje" je zasada projektu, ale dlouho se drzela jen
 * tim, ze si na ni clovek vzpomene. Tohle ji hlida: medailonky ma otvirat
 * CSS `:target`, odkazy maji byt skutecne odkazy a ovladani, ktere bez
 * skriptu nefunguje (filtry, priblizovani mapy), musi zustat skryte —
 * mrtve tlacitko je horsi nez zadne.
 *
 * Potrebuje nainstalovany Microsoft Edge nebo Chrome a bezici nahled
 * (`npm run nahled`) nebo sestaveny web (`npm run sestavit` a `npm run preview`).
 */
import { chromium } from 'playwright-core';

const ADRESA = process.env.ADRESA ?? 'http://localhost:4321/web-za-kninicky/';

const ZELENA = '\x1b[32m';
const CERVENA = '\x1b[31m';
const KONEC = '\x1b[0m';
let chyb = 0;
const overit = (popis, cekano, dostal) => {
  const ok = cekano === dostal;
  if (!ok) chyb++;
  console.log(`${ok ? `${ZELENA}OK   ` : `${CERVENA}CHYBA`}${KONEC} ${popis}` +
    (ok ? '' : `  (cekano: ${cekano}, dostal: ${dostal})`));
};

async function spustProhlizec() {
  for (const kanal of ['msedge', 'chrome', 'chromium']) {
    try {
      return await chromium.launch({ channel: kanal });
    } catch {
      // zkusime dalsi
    }
  }
  throw new Error('Nenasel jsem Edge ani Chrome.');
}

const prohlizec = await spustProhlizec();
const kontext = await prohlizec.newContext({ javaScriptEnabled: false });
const stranka = await kontext.newPage();

try {
  // Medailonek se ma otevrit pres CSS :target, tedy i bez skriptu.
  await stranka.goto(`${ADRESA}lide/#medailonek-4`, { waitUntil: 'load' });
  await stranka.waitForTimeout(400);
  overit('bez JS: medailonek se otevre pres :target', true,
    await stranka.locator('#medailonek-4 .medailonek-panel').isVisible());

  // Navigace na uzkem displeji je <details>, takze funguje bez skriptu.
  overit('bez JS: v hlavicce jsou odkazy', true,
    (await stranka.locator('.nabidka-siroka a').count()) >= 5);

  // Zadna mrtva tlacitka: ovladani, ktere bez skriptu nefunguje, zustava skryte.
  await stranka.goto(`${ADRESA}mapa/`, { waitUntil: 'load' });
  await stranka.waitForTimeout(400);
  overit('bez JS: ovladani mapy je skryte', false,
    await stranka.locator('[data-mapa-ovladani]').isVisible());
  overit('bez JS: seznam zameru je citelny', true,
    (await stranka.locator('.zamer summary').count()) > 0);

  // Listek je ovladany skriptem; bez nej ma byt aspon citelny jako obrazek
  // hlasovaciho listku, ne rozsypany.
  await stranka.goto(`${ADRESA}jak-volit/`, { waitUntil: 'load' });
  await stranka.waitForTimeout(400);
  overit('bez JS: pravidla hlasovani jsou napsana textem', true,
    (await stranka.locator('.zpusob').count()) === 3);
  overit('bez JS: adresa volebni mistnosti je videt', true,
    await stranka.locator('.kde-udaje').isVisible());
} finally {
  await stranka.close();
  await prohlizec.close();
}

console.log(chyb ? `\n${CERVENA}${chyb} CHYB${KONEC}` : `\n${ZELENA}Bez JS vse proslo.${KONEC}`);
process.exit(chyb ? 1 : 0);
