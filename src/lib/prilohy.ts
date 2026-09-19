/**
 * Přílohy k odpovědím — dokumenty, které si lidé můžou stáhnout.
 *
 * Soubory leží v `public/dokumenty/` a do textu se píše jen jejich název.
 * Velikost ani typ se nikam nepíšou ručně: dopočítají se při sestavení
 * z toho, co na disku skutečně je. Ručně psaná velikost se totiž rozejde
 * s realitou hned, jak někdo dokument vymění za novější verzi — a nikdo
 * si toho nevšimne.
 *
 * PROČ `public/`, A NE `src/assets/`: Astro si obsah `src/assets/` přebírá
 * a přejmenovává (to je u obrázků výhoda, protože je umí zmenšit). Dokument
 * ke stažení má mít adresu, kterou jde poslat e-mailem a která se nemění,
 * a název souboru, který po stažení dává smysl — a to `public/` dělá.
 */

import fs from 'node:fs';
import path from 'node:path';

/** Kde dokumenty leží. Cesta od kořene projektu. */
const SLOZKA = 'public/dokumenty';

/** Jak se má příloha ukázat na stránce. */
export interface Priloha {
  /** Název, který uvidí člověk — ne název souboru. */
  nazev: string;
  /** Adresa ke stažení (u našich souborů bez podsložky draftu, tu doplní `odkaz()`). */
  cesta: string;
  /** Přípona velkými písmeny: PDF, DOCX, XLSX… */
  typ: string;
  /** Velikost připravená k vypsání („2,4 MB"), nebo doména u cizího dokumentu. */
  velikost: string;
  /** Leží dokument na cizím webu? Pak se otevírá v novém okně a nestahuje. */
  externi: boolean;
  /** Doplňující věta pod názvem. */
  popis?: string | null;
}

/**
 * Velikost souboru česky: „842 kB", „2,4 MB".
 *
 * Desetinná čárka, ne tečka — je to text pro čtenáře, ne pro počítač.
 * Do jednoho megabajtu se zaokrouhluje na celé kilobajty, výš na desetiny:
 * „1,2 MB" řekne člověku dost, „1234 kB" ho jen zdrží.
 */
export function velikostSouboru(bajtu: number): string {
  if (bajtu < 1024 * 1024) {
    return `${Math.max(1, Math.round(bajtu / 1024))} kB`;
  }

  return `${(bajtu / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/**
 * Připraví přílohu k vykreslení. Když soubor chybí, **shodí sestavení**.
 *
 * Je to schválně, ze stejného důvodu jako u bodů mimo výřez mapy: odkaz
 * na neexistující dokument vypadá na stránce úplně normálně a chyba se
 * pozná až ve chvíli, kdy na něj někdo klikne. Hláška proto rovnou říká,
 * kam soubor nahrát.
 */
export function pripravPrilohu(priloha: {
  nazev: string;
  soubor?: string | null;
  odkaz?: string | null;
  popis?: string | null;
}): Priloha {
  /* Dokument na cizím webu: velikost ani typ z něj nezjistíme, aniž bychom
     ho stáhli — a stahovat cizí server při každém sestavení nebudeme. Místo
     velikosti se proto vypisuje doména, ať je poznat, kam odkaz vede. */
  if (priloha.odkaz) {
    const adresa = new URL(priloha.odkaz);
    /* Typ se hledá v celé cestě, ne jen v jejím konci: brno.cz má za názvem
       souboru ještě identifikátor dokumentu
       (/CS_ANALYTICKA_FINAL.pdf/d5683db9-...), takže poslední kus adresy
       žádnou příponu nemá. */
    const nalezena = adresa.pathname.match(/\.([a-z0-9]{2,5})(?=\/|$)/i);
    const pripona = nalezena ? nalezena[1].toUpperCase() : '';

    return {
      nazev: priloha.nazev,
      cesta: priloha.odkaz,
      typ: pripona || 'WEB',
      velikost: adresa.hostname.replace(/^www\./, ''),
      externi: true,
      popis: priloha.popis,
    };
  }

  const cesta = path.join(SLOZKA, priloha.soubor!);

  if (!fs.existsSync(cesta)) {
    throw new Error(
      `Priloha "${priloha.soubor}" v ${SLOZKA}/ neexistuje. ` +
        `Nahrajte soubor do slozky ${SLOZKA}/ pod presne timto nazvem, ` +
        'nebo opravte nazev v souboru s otazkou.',
    );
  }

  const pripona = path.extname(priloha.soubor).replace('.', '').toUpperCase();

  return {
    nazev: priloha.nazev,
    cesta: `/dokumenty/${priloha.soubor}`,
    typ: pripona || 'soubor',
    velikost: velikostSouboru(fs.statSync(cesta).size),
    externi: false,
    popis: priloha.popis,
  };
}
