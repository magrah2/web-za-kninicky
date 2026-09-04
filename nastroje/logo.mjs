/**
 * Vyrobi logo a favicon:  node nastroje/logo.mjs
 *
 * Logo je ZATIM ZASTUPNE. Vzniklo, aby web nemel v hlavicce diru, a klidne
 * se cele zahodi, az tym dodá vlastni znacku. Do te doby ale musi obstat,
 * takze se nekresli od oka: znacka je geometrie, wordmark je Inter — tedy
 * tentyz rez, jakym je sazeny cely web.
 *
 * Znacka: kruh z linky, uvnitr zeleny breh nad modrou hladinou. Kninicky
 * lezi na Brnenske prehrade a stara ves skoncila pod vodou, kdyz se
 * prehrada v roce 1940 napustila — voda je to jedine, co obec odlisi od
 * kterekoliv jine mestske casti. Kruh zustal prazdny nahore schvalne:
 * plny kotouc byl v hlavicce prilis tezky a na tmavem pruhu splyval.
 *
 * Text se prevadi na cesty schvalne. Logo se nacita pres <img>, kam se
 * webfont ze stranky nedostane, takze <text> by se na kazdem pocitaci
 * vysadilo jinym pismem — presne to, co logo delat nesmi.
 *
 * Rezy Interu se stahuji jednou a ukladaji do nastroje/.pisma/. Berou se
 * staticke soubory, ne ty ze src/pisma/: tam je Inter variabilni a fontkit
 * z jeho woff2 instance vraci prazdne glyfy, takze by z toho nesel dostat
 * jiny rez nez Regular.
 *
 * Inter (c) The Inter Project Authors, licence SIL Open Font License 1.1.
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
    const soubor = path.join(PISMA, `inter-${podmnozina}-${vaha}.woff`);
    if (fs.existsSync(soubor)) continue;
    const adresa = `https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-${podmnozina}-${vaha}-normal.woff`;
    console.log('   stahuji ' + path.basename(soubor));
    const odpoved = await fetch(adresa);
    if (!odpoved.ok) throw new Error(`Stazeni pisma selhalo (${odpoved.status}): ${adresa}`);
    fs.writeFileSync(soubor, Buffer.from(await odpoved.arrayBuffer()));
  }
}

await stahniPisma();

const rez = (podmnozina, vaha) =>
  fontkit.openSync(path.join(PISMA, `inter-${podmnozina}-${vaha}.woff`));

const REZY = {
  500: { latin: rez('latin', 500), ext: rez('latin-ext', 500) },
  700: { latin: rez('latin', 700), ext: rez('latin-ext', 700) },
};

// Barvy jsou tytez jako v src/styles/tokeny.css. Do SVG se musi zapsat
// natvrdo — logo se nacita pres <img>, kam se promenne z CSS nedostanou.
const MODRA = '#1d6eb0'; // --modra: znacka, plochy a grafika
const ZELENA = '#5bae39'; // --zelena: akcent, POUZE plocha a grafika
const ZELENA_TEXT = '#3d7a24'; // --zelena-text: logova zelena ma na text jen 2,9 : 1

/**
 * Vysazi text na cesty.
 *
 * Retezec se deli na useky podle toho, ktery podsoubor Interu ma dany znak.
 * Kerning se pocita uvnitr useku, takze na svu mezi nimi se ztrati — u
 * „Kníni|č|ky" jde o dvojice n-i a k-y, kde Inter nekerni tak jako tak.
 */
function sazba(text, vaha, velikost) {
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
  for (const usek of useky) {
    const rozlozeni = usek.font.layout(usek.text);
    for (let i = 0; i < rozlozeni.glyphs.length; i++) {
      const pozice = rozlozeni.positions[i];
      d += rozlozeni.glyphs[i].path
        .translate(x + (pozice.xOffset ?? 0), pozice.yOffset ?? 0)
        // Zaporne Y: v pisme souradnice rostou nahoru, v SVG dolu.
        .scale(meritko, -meritko)
        .toSVG();
      x += pozice.xAdvance;
    }
  }
  return { d, sirka: x * meritko };
}

/**
 * Znacka ve ctverci 240 x 240.
 *
 * `linka` ridi silu kruhu: v logu je tencí, ve faviconu silnejsi, aby se
 * kruh na 16 pixelech nerozpadl na tenkou nitku.
 */
function znacka({ linka = 20 } = {}) {
  const r = 120 - linka / 2;
  return `  <defs><clipPath id="obrys"><circle cx="120" cy="120" r="${r}"/></clipPath></defs>
  <g clip-path="url(#obrys)">
    <path fill="${ZELENA}" d="M4 158C30 108 54 100 82 124C104 143 118 143 140 118C168 86 200 88 240 122V158Z"/>
    <path fill="${MODRA}" d="M4 158C40 148 76 168 120 168C164 168 200 148 240 158V246H4Z"/>
  </g>
  <circle cx="120" cy="120" r="${r}" fill="none" stroke="${MODRA}" stroke-width="${linka}"/>`;
}

const HLAVICKA = `<!-- Zastupne logo. Vygenerovano skriptem nastroje/logo.mjs - needitovat rucne.
     Wordmark je Inter prevedeny na cesty; Inter (c) The Inter Project Authors,
     licence SIL Open Font License 1.1. -->`;

/** Vodorovna sestava: znacka vlevo, „Za Kníničky" vedle ni. */
function logo({ velikost = 150, mezera = 54, vyska = 300 } = {}) {
  const za = sazba('Za', 500, velikost);
  const mezislovi = sazba('Za ', 500, velikost).sirka;
  const jmeno = sazba('Kníničky', 700, velikost);

  const textX = 240 + mezera;
  // Ucari: Inter ma vysku verzalek 0,727 em, stred verzalky tedy lezi
  // 0,3635 em nad ucarim. Tim se text opticky vystredi na vysku znacky.
  const ucari = vyska / 2 + velikost * 0.3635;
  const sirka = Math.ceil(textX + mezislovi + jmeno.sirka + 6);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sirka} ${vyska}" role="img" aria-label="Za Kníničky">
${HLAVICKA}
  <g transform="translate(0 ${(vyska - 240) / 2})">
${znacka()}
  </g>
  <g transform="translate(${textX} ${ucari})">
    <path fill="${ZELENA_TEXT}" d="${za.d}"/>
    <path fill="${MODRA}" transform="translate(${mezislovi} 0)" d="${jmeno.d}"/>
  </g>
</svg>
`;
}

/** Samotna znacka ve ctverci — favicon a mista, kde by se nazev opakoval. */
function znak({ linka = 20 } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" role="img" aria-label="Za Kníničky">
${HLAVICKA}
${znacka({ linka })}
</svg>
`;
}

const SOUBORY = [
  ['public/logo.svg', logo()],
  // Favicon ma silnejsi linku: na 16 pixelech je kruh siroky jeden a pul
  // pixelu a s puvodni silou by z nej zbyl sedy flek.
  ['public/favicon.svg', znak({ linka: 30 })],
  ['src/assets/logo/znak.svg', znak()],
];

for (const [cesta, obsah] of SOUBORY) {
  const cil = path.join(KOREN, cesta);
  fs.mkdirSync(path.dirname(cil), { recursive: true });
  fs.writeFileSync(cil, obsah);
  console.log('   ' + cesta + '  (' + Math.round(obsah.length / 1024) + ' kB)');
}

console.log('\nHotovo.');
