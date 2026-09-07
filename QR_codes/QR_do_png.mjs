// Rasterizuje QR kody z SVG do PNG.
//
//     node QR_do_png.mjs QR_web_znacka.svg ...
//
// sharp umi SVG vykreslit primo v cilove velikosti; kdyby se vykreslilo
// nadivoko a pak zmensovalo, hrany modulu by se rozmazaly.

import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

const soubory = process.argv.slice(2);
if (!soubory.length) {
  console.error('Pouziti: node QR_do_png.mjs <soubor.svg> ...');
  process.exit(1);
}

for (const cesta of soubory) {
  const svg = await readFile(cesta);
  // Velikost je zapsana v SVG - generator ji zvolil tak, aby na modul
  // vyslo cele cislo pixelu.
  const px = Number(svg.toString('utf8').match(/<svg[^>]*\bwidth="(\d+)"/)[1]);
  const vystup = cesta.replace(/\.svg$/i, '.png');
  // Podklad do QR kodu nepatri: SVG i PNG zustavaji pruhledne, aby je sazba
  // mohla polozit na libovolnou barevnou plochu.
  await sharp(svg).resize(px, px).png({ compressionLevel: 9 }).toFile(vystup);
  console.log(`  ${basename(vystup)}  ${px}x${px} px`);
}
