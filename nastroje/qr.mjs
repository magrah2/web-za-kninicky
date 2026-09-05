/**
 * Vyrobi QR kod s adresou webu:  node nastroje/qr.mjs
 *
 * Vysledek je `public/qr-web.svg` a commituje se. Stejny duvod jako u loga
 * a mapy: hotovy web uz nikam nesaha. Sluzby typu „api.qrserver.com" by
 * znamenaly pozadavek na cizi server pri kazdem zobrazeni letaku.
 *
 * SVG, ne PNG: QR se tiskne a vektor je ostry v jakekoliv velikosti.
 *
 * POZOR NA ADRESU. Bere se z `NAOSTRO`, stejne jako `astro.config.mjs`:
 *
 *   node nastroje/qr.mjs              → draft na GitHub Pages
 *   NAOSTRO=1 node nastroje/qr.mjs    → ostra domena
 *
 * Vytisteny letak s QR kodem, ktery vede na draft, je horsi nez letak bez
 * QR kodu — proto skript adresu vzdy vypise a u draftu na to upozorni.
 */

import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';

const KOREN = path.resolve(import.meta.dirname, '..');
const CIL = 'public/qr-web.svg';

const naostro = process.env.NAOSTRO === '1';
const adresa = naostro ? 'https://zakninicky.cz/' : 'https://magrah2.github.io/web-za-kninicky/';

/*
 * Uroven oprav chyb `M` (asi 15 %) je bezny kompromis pro tisk: vyssi uroven
 * kod zhusti a na letaku by z nej byla sedivá plocha, nizsi neprezije
 * ohnuty nebo umazany papir ve schrance.
 *
 * `margin: 2` je tichá zóna kolem kodu. Bez ni ctecky kod casto nenajdou,
 * protoze se jim slije s okolim.
 */
const svg = await QRCode.toString(adresa, {
  type: 'svg',
  errorCorrectionLevel: 'M',
  margin: 2,
  color: { dark: '#15201a', light: '#00000000' },
});

fs.mkdirSync(path.dirname(path.join(KOREN, CIL)), { recursive: true });
fs.writeFileSync(path.join(KOREN, CIL), svg);

console.log(`   ${CIL}  (${Math.round(svg.length / 1024)} kB)`);
console.log(`   adresa v kodu: ${adresa}`);
if (!naostro) {
  console.log('\nPOZOR: tohle je adresa DRAFTU. Pred tiskem letaku spustte');
  console.log('   NAOSTRO=1 node nastroje/qr.mjs');
  console.log('a hlavne az bude znama skutecna domena, prepiste ji tady i v astro.config.mjs.');
}
