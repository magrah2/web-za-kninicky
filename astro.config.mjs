// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/** Stránky, které existují jen kvůli tisku. Viz `filter` u sitemapy níž. */
const TISKOVE_PODKLADY = ['/letak/', '/inzerce/', '/inzerce-a4/'];

// Draft běží na GitHub Pages v podsložce, ostrý web na vlastní doméně v kořeni.
// Přepíná se proměnnou prostředí, aby se nemuselo sahat do odkazů.
//
// Podsložka draftu se musí jmenovat stejně jako repozitář na GitHubu
// (`magrah2/web-za-kninicky`), jinak by na GitHub Pages nesedělo nic.
//
// POZOR: doména `zakninicky.cz` je zatím zástupná — skutečnou zatím nemáme.
// Až bude, přepsat i v `src/layouts/Zaklad.astro`, kde se podle ní pozná,
// že běh je ostrý a nemá dostat `noindex` ani pruh „Náhled".
const naostro = process.env.NAOSTRO === '1';

export default defineConfig({
  site: naostro ? 'https://zakninicky.cz' : 'https://magrah2.github.io',
  base: naostro ? '/' : '/web-za-kninicky',
  trailingSlash: 'always',
  // Leták a inzerce jsou podklady k tisku, ne stránky pro návštěvníky —
  // do sitemapy a tím do vyhledávačů nepatří. `noindex` mají i ve svých
  // hlavičkách.
  integrations: [
    sitemap({
      filter: (adresa) => !TISKOVE_PODKLADY.some((cesta) => adresa.includes(cesta)),
    }),
  ],
  build: {
    // Každá stránka jako složka s index.html — hezké adresy bez .html
    format: 'directory',
  },
  image: {
    // Portréty a fotky zpracovává Astro samo do avif/webp
    responsiveStyles: true,
  },
});
