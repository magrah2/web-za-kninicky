/**
 * Vyrobi logo a favicon:  node nastroje/logo.mjs
 *
 * Logo je ciste typograficke — zadny obrazek, jen napis „Za Kninicky"
 * ve dvou barvach. Drivejsi znacka (kruh se zelenym brehem nad modrou
 * hladinou) je pryc: web je laden do sedozelene a syta modra hladina
 * v hlavicce byla jedina vec, ktera do neho nepatrila.
 *
 * Wordmark je Montserrat — tedy tentyz rez, jakym je sazeny cely web.
 *
 * Text se prevadi na cesty schvalne. Logo se nacita pres <img>, kam se
 * webfont ze stranky nedostane, takze <text> by se na kazdem pocitaci
 * vysadilo jinym pismem — presne to, co logo delat nesmi.
 *
 * Rezy Montserratu se stahuji jednou a ukladaji do nastroje/.pisma/. Berou
 * se staticke soubory, ne ty ze src/pisma/: tam je Montserrat variabilni
 * a fontkit z jeho woff2 instance vraci prazdne glyfy, takze by z toho nesel
 * dostat jiny rez nez Regular.
 *
 * Montserrat (c) The Montserrat Project Authors, licence SIL Open Font
 * License 1.1.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as fontkit from 'fontkit';

const KOREN = path.resolve(import.meta.dirname, '..');
const PISMA = path.join(KOREN, 'nastroje', '.pisma');

// Vaha 500 pro „Za", 700 pro „Kninicky". Kazda vaha ma dva podsoubory:
// latin ma vsechna pismena krome „c" s hackem, to je jen v latin-ext.
const REZY_KE_STAZENI = [
  ['latin', 500],
  ['latin-ext', 500],
  ['latin', 700],
  ['latin-ext', 700],
];

async function stahniPisma() {
  fs.mkdirSync(PISMA, { recursive: true });
  for (const [podmnozina, vaha] of REZY_KE_STAZENI) {
    const soubor = path.join(PISMA, `montserrat-${podmnozina}-${vaha}.woff`);
    if (fs.existsSync(soubor)) continue;
    const adresa = `https://cdn.jsdelivr.net/npm/@fontsource/montserrat@5/files/montserrat-${podmnozina}-${vaha}-normal.woff`;
    console.log('   stahuji ' + path.basename(soubor));
    const odpoved = await fetch(adresa);
    if (!odpoved.ok) throw new Error(`Stazeni pisma selhalo (${odpoved.status}): ${adresa}`);
    fs.writeFileSync(soubor, Buffer.from(await odpoved.arrayBuffer()));
  }
}

await stahniPisma();

const rez = (podmnozina, vaha) =>
  fontkit.openSync(path.join(PISMA, `montserrat-${podmnozina}-${vaha}.woff`));

const REZY = {
  500: { latin: rez('latin', 500), ext: rez('latin-ext', 500) },
  700: { latin: rez('latin', 700), ext: rez('latin-ext', 700) },
};

/*
 * Barvy se do SVG musi zapsat natvrdo — logo se nacita pres <img>, kam se
 * promenne z CSS nedostanou. Odpovidaji tokenum v src/styles/tokeny.css.
 *
 * Zelena je `--zelena-text`, ne logova `--zelena`: ta ma na svetlem pozadi
 * kontrast 2,9 : 1 a napis je text, at uz je ulozeny jako cesty nebo ne.
 *
 * Seda je zamerne o dost tmavsi nez zelena (8,7 : 1 proti 5,2 : 1 na bile).
 * Kdyz mely oba odstiny stejnou svetlost, lisila se slova jen odstinem —
 * v odstinech sedi, na malem logu a pro barvoslepe splynula v jedno slovo.
 */
const ZELENA_TEXT = '#3d7a24'; // „Za"
const SEDA = '#444e48';        // „Kníničky" — sedá s nadechem do zelena, at sedne do palety

/**
 * Vysazi text na cesty.
 *
 * Retezec se deli na useky podle toho, ktery podsoubor Montserratu ma dany
 * znak. Kerning se pocita uvnitr useku, takze na svu mezi nimi se ztrati —
 * u „KNÍNI|Č|KY" jde o dvojice N-I a K-Y, kde Montserrat nekerni tak jako tak.
 *
 * Vraci i obalku (`obalka`) v souradnicich SVG. Diky ni si viewBox sedne
 * tesne na pismena: bez znacky uz neni ctverec 240 x 240, ktery by vysku
 * urcoval, a natvrdo napsana vyska by nechala nad napisem prazdny pruh.
 */
function sazba(text, vaha, velikost, prostrkani = 0) {
  const { latin, ext } = REZY[vaha];
  const useky = [];
  for (const znak of text) {
    const font = latin.hasGlyphForCodePoint(znak.codePointAt(0)) ? latin : ext;
    const posledni = useky.at(-1);
    if (posledni?.font === font) posledni.text += znak;
    else useky.push({ font, text: znak });
  }

  const meritko = velikost / latin.unitsPerEm;
  let x = 0;
  let d = '';
  const obalka = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

  for (const usek of useky) {
    const rozlozeni = usek.font.layout(usek.text);
    for (let i = 0; i < rozlozeni.glyphs.length; i++) {
      const pozice = rozlozeni.positions[i];
      const cesta = rozlozeni.glyphs[i].path
        .translate(x + (pozice.xOffset ?? 0), pozice.yOffset ?? 0)
        // Zaporne Y: v pisme souradnice rostou nahoru, v SVG dolu.
        .scale(meritko, -meritko);
      d += cesta.toSVG();

      // Mezera zadnou cestu nema a jeji obalka vychazi jako nekonecno —
      // bez tehle podminky by z toho byl viewBox s NaN a prazdne logo.
      const b = cesta.bbox;
      if (Number.isFinite(b.minX)) {
        obalka.minX = Math.min(obalka.minX, b.minX);
        obalka.minY = Math.min(obalka.minY, b.minY);
        obalka.maxX = Math.max(obalka.maxX, b.maxX);
        obalka.maxY = Math.max(obalka.maxY, b.maxY);
      }
      x += pozice.xAdvance + prostrkani / meritko;
    }
  }
  return { d, sirka: x * meritko, obalka };
}

/** Posune obalku po ose X — kdyz se usek sazi jinam nez na nulu. */
const posun = (o, dx) => ({ ...o, minX: o.minX + dx, maxX: o.maxX + dx });

/** Nejmensi obdelnik, do ktereho se vejdou vsechny zadane obalky. */
const spoj = (...obalky) => ({
  minX: Math.min(...obalky.map((o) => o.minX)),
  minY: Math.min(...obalky.map((o) => o.minY)),
  maxX: Math.max(...obalky.map((o) => o.maxX)),
  maxY: Math.max(...obalky.map((o) => o.maxY)),
});

const HLAVICKA = `<!-- Zastupne logo. Vygenerovano skriptem nastroje/logo.mjs - needitovat rucne.
     Wordmark je Montserrat prevedeny na cesty; Montserrat (c) The Montserrat
     Project Authors, licence SIL Open Font License 1.1. -->`;

/**
 * Napis „ZA KNÍNIČKY" — „ZA" zelene, „KNÍNIČKY" sede.
 *
 * Verzalkami na prani tymu. Verzalky potrebuji kladne prostrkani: pismo je
 * kernene pro mala pismena a bez nej se v celych verzalkach slova slepi.
 * 0,03 em je tolik, aby to bylo znat, a min, nez kolik uz by z napisu
 * udelalo rozsypany caj.
 */
function logo({ velikost = 150 } = {}) {
  const prostrkani = velikost * 0.03;
  const za = sazba('ZA', 500, velikost, prostrkani);
  const mezislovi = sazba('ZA ', 500, velikost, prostrkani).sirka;
  const jmeno = sazba('KNÍNIČKY', 700, velikost, prostrkani);

  // Okraj kolem napisu. Bez nej by se cárky nad „í" a nozicka „y" dotykaly
  // hrany obrazku a pri zaobleni nebo oriznuti by se ustrihly.
  const okraj = velikost * 0.06;
  const o = spoj(za.obalka, posun(jmeno.obalka, mezislovi));

  const sirka = Math.ceil(o.maxX - o.minX + okraj * 2);
  const vyska = Math.ceil(o.maxY - o.minY + okraj * 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sirka} ${vyska}" role="img" aria-label="Za Kníničky">
${HLAVICKA}
  <g transform="translate(${(okraj - o.minX).toFixed(2)} ${(okraj - o.minY).toFixed(2)})">
    <path fill="${ZELENA_TEXT}" d="${za.d}"/>
    <path fill="${SEDA}" transform="translate(${mezislovi.toFixed(2)} 0)" d="${jmeno.d}"/>
  </g>
</svg>
`;
}

/**
 * Monogram „ZK" ve ctverci — favicon.
 *
 * Favicon musi byt obrazek, takze cely napis se do nej nevejde: na 16
 * pixelech by z „Za Kníničky" byla seda smouha. Monogram drzi obe barvy
 * loga, takze zalozka a hlavicka porad patri k sobe.
 */
function znak() {
  const VELIKOST = 100;
  const z = sazba('Z', 700, VELIKOST);
  const k = sazba('K', 700, VELIKOST);
  // Kerning mezi Z a K je v Montserratu nulovy, takze staci sirka samotneho „Z".
  const o = spoj(z.obalka, posun(k.obalka, z.sirka));

  const sirkaTextu = o.maxX - o.minX;
  const vyskaTextu = o.maxY - o.minY;
  // Ctverec 240 s okrajem 24 — monogram se do nej vejde delsi stranou.
  const meritko = (240 - 48) / Math.max(sirkaTextu, vyskaTextu);
  const posunX = (240 - sirkaTextu * meritko) / 2 - o.minX * meritko;
  const posunY = (240 - vyskaTextu * meritko) / 2 - o.minY * meritko;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="Za Kníničky">
${HLAVICKA}
  <g transform="translate(${posunX.toFixed(2)} ${posunY.toFixed(2)}) scale(${meritko.toFixed(4)})">
    <path fill="${ZELENA_TEXT}" d="${z.d}"/>
    <path fill="${SEDA}" transform="translate(${z.sirka.toFixed(2)} 0)" d="${k.d}"/>
  </g>
</svg>
`;
}

const SOUBORY = [
  ['public/logo.svg', logo()],
  ['public/favicon.svg', znak()],
];

for (const [cesta, obsah] of SOUBORY) {
  const cil = path.join(KOREN, cesta);
  fs.mkdirSync(path.dirname(cil), { recursive: true });
  fs.writeFileSync(cil, obsah);
  console.log('   ' + cesta + '  (' + Math.round(obsah.length / 1024) + ' kB)');
}

// Pomer stran se vypisuje kvuli atributum `width`/`height` u <img>
// v Hlavicce a na uvodni strance. Jsou tam proto, aby stranka pri nacitani
// neposkocila — a kdyz se logo prekresli na jiny pomer, musi se prepsat.
const rozmer = /viewBox="0 0 (\d+) (\d+)"/.exec(logo());
console.log(`\n   pomer stran loga: ${rozmer[1]} x ${rozmer[2]}`);
console.log('   (tyhle dve cisla patri do width/height u <img> v Hlavicce a index.astro)');

console.log('\nHotovo.');
