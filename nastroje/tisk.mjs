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
 */
const PODKLADY = {
  letak: { cesta: 'letak/', soubor: 'letak.pdf', stran: null },
  inzerce: { cesta: 'inzerce/', soubor: 'inzerce.pdf', stran: 1 },
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

await stranka.pdf({
  path: cil,
  format: 'A5',
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

console.log(`\n   ${podklad.soubor}  (${stran} stran A5, ${Math.round(obsah.length / 1024)} kB)`);
console.log(`   z adresy:  ${adresa}`);

if (podklad.stran !== null && stran !== podklad.stran) {
  console.error(`\nCHYBA: ceka se ${podklad.stran} stran, vyslo ${stran}.`);
  console.error('Obsah pretekl - zkratte text nebo zmenste sazbu ve zdroji stranky.');
  process.exit(1);
}

console.log('\nSoubor je v gitignore - je to vysledek, ne zdroj.');
