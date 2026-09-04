/**
 * Skládá odkazy tak, aby fungovaly na draftu i na ostrém webu.
 *
 * Draft běží na github.io v podsložce `/web-za-kninicky/`, ostrý web bude v kořeni
 * domény. Kdyby se odkazy psaly natvrdo, po přepnutí by všechny vedly vedle.
 * Proto se všude uvnitř webu odkazuje přes tuhle funkci.
 *
 *   odkaz('/lide/')  →  '/web-za-kninicky/lide/'  na draftu
 *                    →  '/lide/'         naostro
 */
export function odkaz(cesta: string): string {
  const zaklad = import.meta.env.BASE_URL; // '/web-za-kninicky/' nebo '/'
  const bezLomitka = cesta.startsWith('/') ? cesta.slice(1) : cesta;
  return zaklad.endsWith('/') ? zaklad + bezLomitka : `${zaklad}/${bezLomitka}`;
}

/** Kombinující diakritická znaménka, která po rozkladu NFD zbydou nad písmeny.
    `\p{Mn}` = nonspacing mark; psáno takhle, aby ve zdroji nebyly neviditelné znaky. */
const DIAKRITIKA = /\p{Mn}/gu;

/**
 * Tituly před jménem i za ním.
 *
 * Tečka je součástí shody a `(?=[\s,]|$)` hlídá, že se odstraní celý titul
 * včetně ní. Kdyby na konci stálo jen `\b`, tečka by ve jméně zůstala
 * a na kartě by svítilo „. . Barbora Jelínková".
 *
 * Delší varianty musí být v seznamu před kratšími (`Ph\.D` před `PhDr`),
 * jinak by kratší shoda ukousla jen část.
 *
 * `arch` je v seznamu samostatně, protože „Ing. arch." jsou dva tituly za
 * sebou, ne jeden. Bez něj by na kartě zůstalo „arch. Barbora Jelínková".
 */
const TITULY = /\b(Ph\.?D|Bc|Mgr|MgA|MBA|Ing|arch|MUDr|JUDr|PhDr|RNDr|ThDr|doc|prof|CSc|DrSc|DiS|et)\.?(?=[\s,]|$)/g;

/**
 * Jméno bez akademických titulů — pro kartu v mřížce.
 * „Ing. arch. Barbora Jelínková, Ph.D." → „Barbora Jelínková"
 *
 * Na kartě je málo místa a tituly z něj dělají kaši; celé jméno včetně
 * titulů se ukáže v medailonku, kde na ně je prostor.
 */
export function jmenoBezTitulu(jmeno: string): string {
  return jmeno
    .replace(TITULY, ' ')
    .replace(/\s+/g, ' ')
    // Po vyjmutí titulu za jménem zbyde osiřelá čárka: „Leder , " → „Leder"
    .replace(/\s*,\s*/g, ', ')
    .replace(/^[\s,]+|[\s,]+$/g, '');
}

/**
 * Ze jména kandidáta udělá adresu — bez titulů, bez diakritiky, malými písmeny.
 * „MUDr. Miloš Šteffl, Ph.D." → „milos-steffl"
 */
export function slugZeJmena(jmeno: string): string {
  return jmeno
    .replace(TITULY, ' ')
    .replace(/,/g, ' ')
    .normalize('NFD')
    .replace(DIAKRITIKA, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
