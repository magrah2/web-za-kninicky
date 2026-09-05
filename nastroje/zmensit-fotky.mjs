/**
 * Zmensi fotky kandidatu na rozumnou velikost pro web:  node nastroje/zmensit-fotky.mjs
 *
 * Puvodni fotky z fotoaparatu maji nekolik MB kazda a do gitu nepatri - viz
 * .gitignore. Zdroj je slozka `fotky-original/` (mimo verzovani), vysledek
 * jde do `src/assets/portrety/`, odkud uz fotky bere zbytek webu
 * (src/lib/portrety.ts). Nazev souboru se nemeni, jen pripona vzdy na .jpg.
 *
 * Bezpecne se da spoustet opakovane - kazde spusteni prepise vsechno znovu.
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ZDROJ = 'fotky-original';
const CIL = 'src/assets/portrety';

// Vetsi nez nejvetsi velikost, ve ktere web fotku skutecne pouzije
// (detail medailonku chce nejvys 1080 px sirky) - rezerva pro ostre displeje.
const NEJVETSI_ROZMER = 1600;
const KVALITA = 82;

if (!fs.existsSync(ZDROJ)) {
  console.log(`Slozka ${ZDROJ}/ neexistuje - neni co zmensovat.`);
  process.exit(0);
}

const soubory = fs.readdirSync(ZDROJ).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

if (soubory.length === 0) {
  console.log(`Ve slozce ${ZDROJ}/ nejsou zadne fotky.`);
  process.exit(0);
}

/*
 * VYREZ NA HLAVU A RAMENA
 *
 * Fotky z fotografovani jsou celopostavy. Na kartach i v medailonku je z nich
 * ale ramecek 4 : 5 vysoky par set pixelu - z celopostavy je v nem clovek
 * velky jako palec a obliceje se nedaji rozeznat. Rez se proto dela tady,
 * ne v CSS: `object-fit` umi jen posunout vyrez, ne priblizit.
 *
 * Pro kazdou fotku jsou potreba DVE cisla, obe jako podil vysky puvodni
 * fotky: kde je `temeno` hlavy a jak je hlava `vysoka` (od temene po bradu).
 *
 * Vyska hlavy tu neni navic. Kdyby se vyrez odvozoval jen od temene a mel
 * pro vsechny stejnou vysku, kazdy by v ramecku mel hlavu jinak velkou -
 * lide jsou ruzne vysoci a stali ruzne daleko od objektivu. Takhle se vyrez
 * skaluje s hlavou a v mrizce portretu vychazeji vsechny hlavy stejne.
 *
 * Zmerit se to da z kontaktni kopie: vyrezy hlav vedle sebe s vodorovnymi
 * linkami po dvou procentech. Z kodu se to odhadnout neda.
 *
 * Vodorovne se necentruje podle hlavy, ale na stred: na vsech fotkach stoji
 * clovek uprostred zaberu (obliceje vychazi na 48-51 % sirky), takze by to
 * byl dalsi udaj k udrzovani bez uzitku.
 *
 * Fotka, ktera tu zaznam nema, se NEOREZE a skript to hlasi. Je to schvalne:
 * tise pouzity spatny vyrez by si nikdo nevsiml, kdezto celopostava mezi
 * portrety je videt na prvni pohled.
 */
const HLAVA = {
  '01-pavel-jankuj': { temeno: 0.13, vysoka: 0.16 },
  '02-barbora-jelinkova': { temeno: 0.283, vysoka: 0.13 },
  '03-karolina-pokorna': { temeno: 0.287, vysoka: 0.15 },
  '04-petr-krejci': { temeno: 0.21, vysoka: 0.13 },
  '06-milos-steffl': { temeno: 0.157, vysoka: 0.16 },
  '07-pavel-jankuj': { temeno: 0.213, vysoka: 0.15 },
  '08-nada-pokorna': { temeno: 0.24, vysoka: 0.13 },
};

/**
 * Kolikrat je vyrez vyssi nez hlava. Tohle cislo urcuje, JAK VELKE budou
 * hlavy: mensi cislo = kratsi vyrez = vetsi hlava. Pri 2,7 zabira hlava
 * o neco vic nez tretinu vysky ramecku.
 *
 * POZOR NA SPOJENOU NADOBU: prazdny pruh nad hlavou vychazi jako
 * `NAD_HLAVOU / VYREZ_NA_HLAVY`. Kdyz se tohle cislo zmeni a `NAD_HLAVOU`
 * ne, hlavy sice zmeni velikost, ale zaroven se posunou nahoru nebo dolu.
 * Pri zvetsovani hlav se proto obe cisla meni spolu ve stejnem pomeru.
 */
const VYREZ_NA_HLAVY = 2.7;

/** Vyjimky z `VYREZ_NA_HLAVY` — kdo ma mit hlavu jinak velkou nez ostatni. */
const VYREZ_NA_HLAVY_VYJIMKY = {
  // Zustava na puvodnich 2,9, takze ma hlavu o neco mensi nez zbytek.
  // Na prani tymu.
  '06-milos-steffl': 2.9,
};

/**
 * Kolik zustane nad temenem, jako podil VYSKY HLAVY (ne fotky). Kdyby to byl
 * podil fotky, mel by kazdy nad hlavou jinak siroky pruh vzduchu.
 *
 * PREPOCET NA TO, CO JE VIDET: prazdny pruh nad hlavou zabira ve vyrezu
 * `NAD_HLAVOU / VYREZ_NA_HLAVY` jeho vysky. Pri 0,93 a 2,7 to je 34 %.
 * Tim se to da nastavovat podle vysledku, ne od oka.
 *
 * Kolik se da dat, urcuje puvodni fotka: nad temenem na ni musi tolik mista
 * skutecne byt. Strop je `temeno / vysoka`:
 *
 *   Jankuj c. 1  0,81      Steffl       0,98      Krejci      1,62
 *   Jankuj c. 7  1,42      Pokorna N.   1,85      Pokorna K.  1,91
 *   Jelinkova    2,18
 *
 * Tuhle spolecnou hodnotu bere pet ze sedmi. Vyjimku maji jen dva, oba
 * smerem dolu (hlava vys v ramecku) - viz nize.
 */
const NAD_HLAVOU = 0.93;

/** Vyjimky z `NAD_HLAVOU`. Vic vzduchu nad hlavou = oblicej nize v ramecku. */
const NAD_HLAVOU_VYJIMKY = {
  // Strop 0,81 — vic uz na jeho fotce nad hlavou neni. Ma tim nad hlavou
  // o neco min nez ostatni; neni to prehlednuti, je to hranice snimku.
  '01-pavel-jankuj': 0.7,
  // Min nez ostatni, na prani tymu - hlavu vys v ramecku.
  // Jeho strop je 0,98, takze mista by bylo dost; je to volba, ne omezeni.
  '06-milos-steffl': 0.75,
};

/** Pomer stran vyrezu - stejny, jaky ma ramecek portretu v Portret.astro.
    Kdyby se lisil, `object-fit: cover` by z vyrezu jeste kus ubral. */
const POMER = 4 / 5;

fs.mkdirSync(CIL, { recursive: true });

let bezVyrezu = 0;
const zarazene = [];

for (const soubor of soubory) {
  const id = soubor.replace(/\.[^.]+$/, '');
  const vstup = path.join(ZDROJ, soubor);
  const vystup = path.join(CIL, `${id}.jpg`);

  const { size: velikostPred } = fs.statSync(vstup);

  // `.rotate()` musi predchazet cteni rozmeru: fotka na sirku ulozena
  // s EXIF orientaci ma v metadatech prohozene strany a vyrez by z ni
  // vysel mimo.
  const obrazek = sharp(vstup).rotate();
  const { width: sirka, height: vyska } = await obrazek.metadata();

  const hlava = HLAVA[id];
  if (hlava === undefined) bezVyrezu++;

  if (hlava !== undefined) {
    const vyskaHlavy = vyska * hlava.vysoka;
    const vyrezNaHlavy = VYREZ_NA_HLAVY_VYJIMKY[id] ?? VYREZ_NA_HLAVY;
    let vyskaVyrezu = Math.round(vyskaHlavy * vyrezNaHlavy);
    let sirkaVyrezu = Math.round(vyskaVyrezu * POMER);

    // Kdyby vyrez vysel siroci nez fotka, zmensi se cely (i na vysku), aby
    // se nezmenil pomer stran — jinak by `object-fit: cover` v prohlizeci
    // ubral z hlavy a vysledek by se od ostatnich lisil.
    if (sirkaVyrezu > sirka) {
      const zmenseni = sirka / sirkaVyrezu;
      sirkaVyrezu = sirka;
      vyskaVyrezu = Math.round(vyskaVyrezu * zmenseni);
    }
    vyskaVyrezu = Math.min(vyskaVyrezu, vyska);

    // Kdyby vyrez vysel za okraj fotky, sharp skonci chybou. Radsi ho
    // zarazime u hrany, nez aby spadl cely prevod — ale rekneme o tom:
    // zarazeny vyrez ma nad hlavou min vzduchu nez ostatni a v mrizce
    // portretu to je videt.
    const nadHlavou = NAD_HLAVOU_VYJIMKY[id] ?? NAD_HLAVOU;
    const chtene = Math.round(vyska * hlava.temeno - vyskaHlavy * nadHlavou);
    if (chtene < 0) {
      const strop = (hlava.temeno / hlava.vysoka).toFixed(2);
      zarazene.push(`${id} (snizte nad hlavou pod ${strop}, nebo mu uberte z vysky hlavy)`);
    }
    const shora = Math.min(Math.max(0, chtene), Math.max(0, vyska - vyskaVyrezu));
    obrazek.extract({
      left: Math.max(0, Math.round((sirka - sirkaVyrezu) / 2)),
      top: shora,
      width: sirkaVyrezu,
      height: vyskaVyrezu,
    });
  }

  await obrazek
    .resize({ width: NEJVETSI_ROZMER, height: NEJVETSI_ROZMER, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: KVALITA, mozjpeg: true })
    .toFile(vystup);

  const { size: velikostPo } = fs.statSync(vystup);
  const kB = (b) => Math.round(b / 1024);
  console.log(
    `${id}: ${kB(velikostPred)} kB -> ${kB(velikostPo)} kB` +
      (hlava === undefined ? '   BEZ VYREZU - dopiste ho do HLAVA v nastroje/zmensit-fotky.mjs' : ''),
  );
}

console.log(`\nHotovo - ${soubory.length} fotek v ${CIL}/.`);
if (bezVyrezu > 0) {
  console.log(`POZOR: ${bezVyrezu} fotek zustalo celopostavnich - viz radky vyse.`);
}
if (zarazene.length > 0) {
  console.log('POZOR: u techhle fotek se vyrez zarazil o horni hranu, takze maji');
  console.log('nad hlavou min vzduchu nez ostatni:');
  for (const z of zarazene) console.log('  - ' + z);
}
