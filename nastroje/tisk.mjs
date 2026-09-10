/**
 * Vyrobi tiskovy podklad jako PDF:  npm run letak   |   npm run inzerce
 *
 * PROC SKRIPT, A NE JEN PROHLIZEC: stranky /letak/ a /inzerce/ na obrazovce
 * tecou v jednom dlouhem sloupci. Neni to nedodelek - HTML se na strany
 * rozdelit neumi, dokud nejde do tisku. Rozdeleni dela az sazba pro tisk
 * a ta zna pravidla, ktera na obrazovce nic nedelaji: nadpis nesmi zustat
 * sam na konci strany, odrazka se nesmi roztrhnout, kandidat se nesmi
 * rozdelit mezi fotku a jmeno.
 *
 * Tenhle skript tedy necha sazbu udelat prohlizec a vysledek ulozi. Je to
 * presne to, co vyleze z tiskarny, vcetne poctu stran. Totez ukaze Ctrl+P
 * primo na strance; skript je od toho, aby PDF slo poslat tiskarne nebo
 * redakci zpravodaje, aniz by ho kazdy tiskl sam.
 *
 * POTREBUJE BEZICI SERVER (npm run dev). Jina adresa jde predat druhym
 * argumentem:
 *
 *   npm run letak
 *   npm run inzerce -- http://localhost:4322/web-za-kninicky/
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const KOREN = path.resolve(import.meta.dirname, '..');

/**
 * Co se da vytisknout.
 *
 * `stran` je ocekavany pocet stran, nebo `null`, kdyz na nem nezalezi.
 * U inzerce zalezi: je to jedna strana do zpravodaje a druha strana by
 * znamenala, ze text pretekl. Vypada to jako drobnost, jenze prebytecnou
 * stranu v PDF nikdo nehleda - vsimne si ji az sazec ve zpravodaji.
 *
 * `format` je jmeno z A-rady, `rozmer` vlastni velikost. Prave jedno z nich.
 * Vlastni rozmer neni rozmar: zpravodaj si misto pro inzerci mericky
 * rozvrhuje sam a 190 x 134 mm neni zadna otocena A-rada.
 *
 * `nejmensiPismo` je spodni mez velikosti pisma v milimetrech, kterou zadala
 * tiskarna. Kontroluje se nize primo ve strance - od oka to poznat nejde
 * a "trochu zmensit, aby se to veslo" je presne to, co se pri sazbe stane.
 */
const PODKLADY = {
  letak: { cesta: 'letak/', soubor: 'letak.pdf', format: 'A5', stran: null },
  inzerce: { cesta: 'inzerce/', soubor: 'inzerce.pdf', format: 'A5', stran: 1 },
  'inzerce-a4': { cesta: 'inzerce-a4/', soubor: 'inzerce-a4.pdf', format: 'A4', stran: 1 },
  // Dve varianty tehoz podkladu: fotka vlevo, nebo vpravo. Sazbu drzi jedna
  // komponenta, lisi se jen poradim sloupcu.
  'inzerce-na-sirku': {
    cesta: 'inzerce-na-sirku/',
    soubor: 'inzerce-na-sirku.pdf',
    rozmer: { sirka: '190mm', vyska: '134mm', popis: '190 x 134 mm' },
    stran: 1,
    nejmensiPismo: 2.5,
  },
  'inzerce-na-sirku-2': {
    cesta: 'inzerce-na-sirku-2/',
    soubor: 'inzerce-na-sirku-2.pdf',
    rozmer: { sirka: '190mm', vyska: '134mm', popis: '190 x 134 mm' },
    stran: 1,
    nejmensiPismo: 2.5,
  },
  'inzerce-na-sirku-3': {
    cesta: 'inzerce-na-sirku-3/',
    soubor: 'inzerce-na-sirku-3.pdf',
    rozmer: { sirka: '190mm', vyska: '134mm', popis: '190 x 134 mm' },
    stran: 1,
    nejmensiPismo: 2.5,
  },
};

const jmeno = process.argv[2];
const podklad = PODKLADY[jmeno];

if (!podklad) {
  console.error(`\nCHYBA: neznamy podklad "${jmeno ?? ''}".`);
  console.error(`Mozne hodnoty: ${Object.keys(PODKLADY).join(', ')}`);
  process.exit(1);
}

const ZAKLAD = process.argv[3] ?? 'http://localhost:4321/web-za-kninicky/';
const adresa = new URL(podklad.cesta, ZAKLAD).href;
const cil = path.join(KOREN, podklad.soubor);

const prohlizec = await chromium.launch({ channel: 'chrome' });
const stranka = await prohlizec.newPage();

try {
  await stranka.goto(adresa, { waitUntil: 'networkidle' });
} catch {
  console.error(`\nCHYBA: na ${adresa} nic neodpovida.`);
  console.error('Spustte nejdriv vyvojovy server:  npm run dev');
  await prohlizec.close();
  process.exit(1);
}

/*
 * Obrazky se musi stihnout nejen stahnout, ale i vykreslit. `loading` rika,
 * kdy se stahnou, `decoding` kdy se vykresli - a do PDF jde jen to druhe.
 * Bez tohohle radku z letaku obcas vypadly portrety a poznalo by se to az
 * z vytistenych stranek.
 */
await stranka.evaluate(() => Promise.all([...document.images].map((o) => o.decode().catch(() => {}))));
await stranka.evaluate(() => document.fonts.ready);

/*
 * Nejmensi pismo se meri az na vysazene strance, ne ve zdroji. Ve zdroji jsou
 * milimetry, jenze na text pusobi i dedena velikost a `em` v rodici - vysledek
 * v CSS videt neni.
 *
 * Meri se jen prvky, ktere samy nesou text a jsou videt. Odstavec, ktery ma
 * uvnitr jen dalsi znacky, zadne pismo nekresli a jeho velikost by mereni
 * jen zkreslila.
 */
if (podklad.nejmensiPismo) {
  const nalezy = await stranka.evaluate(() => {
    const vysledky = [];

    for (const prvek of document.querySelectorAll('.inzerat *, .inzerat')) {
      const maVlastniText = [...prvek.childNodes].some(
        (uzel) => uzel.nodeType === Node.TEXT_NODE && uzel.textContent.trim() !== '',
      );
      if (!maVlastniText || prvek.getClientRects().length === 0) continue;

      const px = parseFloat(getComputedStyle(prvek).fontSize);
      vysledky.push({
        mm: (px * 25.4) / 96,
        // Prvnich par slov staci na to, aby slo misto najit.
        ukazka: prvek.textContent.trim().replace(/\s+/g, ' ').slice(0, 40),
      });
    }

    return vysledky.sort((a, b) => a.mm - b.mm);
  });

  // Desetina milimetru je pod rozlisovaci schopnosti sazby; bez zaokrouhleni
  // by kontrola padala na 2,4999 mm z prepoctu px na mm.
  const male = nalezy.filter((n) => Math.round(n.mm * 100) / 100 < podklad.nejmensiPismo);

  if (male.length > 0) {
    console.error(`\nCHYBA: nejmensi pismo ma byt ${podklad.nejmensiPismo} mm, ale:`);
    for (const n of male.slice(0, 10)) {
      console.error(`   ${n.mm.toFixed(2)} mm  "${n.ukazka}"`);
    }
    await prohlizec.close();
    process.exit(1);
  }

  console.log(`\n   nejmensi pismo: ${nalezy[0].mm.toFixed(2)} mm  "${nalezy[0].ukazka}"`);
}

await stranka.pdf({
  path: cil,
  // Format se bere z tabulky vys. `preferCSSPageSize` sice necha rozhodnout
  // `@page` ve strance a vyhraje, ale mit tu natvrdo A5 i pro A4 podklad je
  // past pro toho, kdo bude tabulku cist.
  ...(podklad.rozmer
    ? { width: podklad.rozmer.sirka, height: podklad.rozmer.vyska }
    : { format: podklad.format }),
  printBackground: true,
  // Okraje si urcuje `@page` na strance - tohle rekne prohlizeci, aby je
  // respektoval misto svych vlastnich.
  preferCSSPageSize: true,
});

await prohlizec.close();

/*
 * Pocet stran se necte z prohlizece, ale ze souboru: je to jedina hodnota,
 * kterou lze overit az na hotovem PDF. Kdyz nekdo prida odrazku do programu,
 * je tohle cislo prvni, co se zmeni.
 */
const obsah = fs.readFileSync(cil);
const stran = (obsah.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;

const popisFormatu = podklad.rozmer ? podklad.rozmer.popis : podklad.format;

console.log(`\n   ${podklad.soubor}  (${stran} stran ${popisFormatu}, ${Math.round(obsah.length / 1024)} kB)`);
console.log(`   z adresy:  ${adresa}`);

if (podklad.stran !== null && stran !== podklad.stran) {
  console.error(`\nCHYBA: ceka se ${podklad.stran} stran, vyslo ${stran}.`);
  console.error('Obsah pretekl - zkratte text nebo zmenste sazbu ve zdroji stranky.');
  process.exit(1);
}

console.log('\nSoubor je v gitignore - je to vysledek, ne zdroj.');
