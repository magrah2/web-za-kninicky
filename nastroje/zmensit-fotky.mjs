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
  /*
   * Nova fotka ze zari 2026, jina nez ta puvodni. Cisla nejsou odhadnuta
   * od oka: zmeril jsem svisly rozsah SVETLE plochy obliceje u ni a u
   * Barbory (349 px a 346 px, tedy skoro stejne) a jeji `vysoka` je pak
   * ta Barborina prepocitana tymtez pomerem.
   *
   * Prvni pokus mel 0,202, protoze jsem hlavu merel od vlasu po bradu podle
   * oka. Vysledek byl viditelne mensi nez ostatni - kdyz je `vysoka` moc
   * velka, vyrez vyjde vyssi a hlava se v nem zmensi.
   */
  '08-nada-pokorna': { temeno: 0.219, vysoka: 0.13 },
  /*
   * Jeho fotka je jina nez ostatni: studiovy portret na bilem pozadi,
   * zabery po ramena. Hlava na ni zabira pres 0,6 vysky, kdezto u ostatnich
   * 0,13-0,16. Neni to preklep v merenim, je to jiny snimek.
   *
   * POZOR: cisla plati pro fotku PO OREZU OKRAJU (viz ORIZ_OKRAJE), protoze
   * v tom poradi je pipeline pouziva. Merene na puvodnich 1193 px vychazel
   * vyrez o 1,7 % mensi - dost na to, aby prestal sedet pozadovany
   * centimetr, a moc malo na to, aby si toho nekdo vsiml.
   *
   * Po orezu ma fotka 880 x 1175 px, teme je na 41 px a hlava meri 710 px.
   */
  '09-tomas-leder': { temeno: 0.0349, vysoka: 0.6043 },
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
  /*
   * Jeho fotka je zabrana mnohem blize nez ostatni, takze se kolem ni
   * dokresluje pozadi (viz TMAVE_POZADI). Pri spolecnych 2,7 by hlava sice
   * velikosti sedela ostatnim, jenze ramenna cast by zabirala jen pulku
   * sirky a clovek by v ramecku plaval v prazdnu - z fotky po ramena se
   * dokreslenim celopostava neudela.
   *
   * 1,9 je vybrano z variant vykreslenych vedle sebe (2,7 / 2,2 / 1,9 / 1,58).
   * Hlava je vetsi nez u ostatnich - 53 % ramecku proti 37 % - ale ramena
   * ramecek vyplni a karta nepusobi prazdne. Pri 2,7, kdy hlava velikosti
   * presne sedela, clovek v ramecku plaval: z fotky po ramena se dokreslenim
   * pozadi celopostava neudela. Z cisel se to posoudit nedalo.
   */
  /*
   * ODVOZENO Z POZADAVKU „1 cm nalevo a 1 cm nahore" na hotovem portretu.
   *
   * Portret ma na karte 56,5 x 70,6 mm, takze 1 cm je 17,7 % sirky
   * a 14,2 % vysky. Po orezu okraju ma jeho fotka 880 x 1175 px a hlava
   * na ni 710 px:
   *
   *   sirka vyrezu  = 880 / (1 - 0,177) = 1069 px
   *   vyska vyrezu  = 1069 / 0,8        = 1336 px
   *   pomer k hlave = 1336 / 710        = 1,88
   *
   * Hlava tim vyjde na 53 % ramecku. Neni to volba, je to dusledek tech
   * dvou centimetru - kdyby mela byt jina, musi se zmenit i ony.
   */
  '09-tomas-leder': 1.88,
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
  /*
   * Take odvozeno z toho centimetru nahore: 14,2 % z 1336 px je 190 px
   * dokresleneho pruhu, k tomu 41 px, ktere nad temenem zbyly na fotce po
   * orezu okraje. Dohromady 231 px, coz je 0,325 vysky hlavy.
   */
  '09-tomas-leder': 0.325,
};

/*
 * ZAMENA BILEHO STUDIOVEHO POZADI ZA TMAVE
 *
 * Osm fotek je z jednoho foceni venku, na tmavem pozadi. Devata je studiovy
 * portret na bile - v mrizce portretu svitila jako jedina bila dlazdice.
 * Zdrojem je jina fotka, ne chyba, takze se to orezem spravit neda.
 *
 * Hodnota je PRAH SVETLOSTI: pixel, ktery ma vsechny tri slozky aspon
 * takove, se muze pocitat za pozadi. U pana Ledera je pozadi ciste 255,
 * kdezto bila kosile ma 243 - proto 250. Pri nizsim prahu zaplava protekla
 * limcem do kosile a ta zcernala taky.
 */
const TMAVE_POZADI = {
  '09-tomas-leder': 250,
};

/**
 * Kolik pixelu se pred zamenou pozadi ustrihne z kazde strany.
 *
 * Na okrajich snimku nebylo pozadi uplne ciste bile a rozostreni masky ho
 * navic po obvodu nechalo z casti prosvitat - kolem puvodniho obdelniku pak
 * byl v dokreslene plose videt svetlejsi lem. Neni to chyba zaplavy: lem je
 * v samotne fotce.
 *
 * Strihat se da bez lítosti, protoze plocha se stejne vzapeti dokresluje.
 */
const ORIZ_OKRAJE = {
  '09-tomas-leder': { vlevo: 4, vpravo: 12, nahore: 4, dole: 14 },
};

/**
 * Odstin, na ktery se pozadi meni. Neni to cerna, ale prumer pozadi
 * ostatnich portretu (zmereno v jejich hornich rozich) - cerna by v mrizce
 * byla tmavsi nez vsechny okolni fotky a stejne by vycnivala.
 */
const ODSTIN_POZADI = [50, 43, 38];

/**
 * Nahradi pozadi. Nehleda se prahem pres celou fotku, ale ZAPLAVOU OD OKRAJU:
 * sedive vlasy a bila kosile jsou stejne svetle jako studiove pozadi a prah
 * by je sezral. Zaplava se k nim nedostane, dokud je oddeluje tmavsi obrys.
 *
 * Maska se pak rozostri, aby okraj vlasu nemel schod.
 */
async function ztmavitPozadi(obrazek, prah) {
  const { data, info } = await obrazek.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: k } = info;

  const jePozadi = (i) =>
    data[i * k] >= prah && data[i * k + 1] >= prah && data[i * k + 2] >= prah;

  const maska = new Uint8Array(w * h);
  const fronta = [];
  for (let x = 0; x < w; x++) fronta.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) fronta.push(y * w, y * w + w - 1);

  while (fronta.length > 0) {
    const i = fronta.pop();
    if (maska[i] || !jePozadi(i)) continue;
    maska[i] = 255;
    const x = i % w;
    const y = (i - x) / w;
    if (x > 0) fronta.push(i - 1);
    if (x < w - 1) fronta.push(i + 1);
    if (y > 0) fronta.push(i - w);
    if (y < h - 1) fronta.push(i + w);
  }

  // Pocet kanalu po rozostreni se cte z `info`. Sharp jich vraci vic, nez
  // kolik jich do nej slo, a pri pevne zapsane jednicce se maska rozjede
  // do vodorovnych pruhu pres celou fotku.
  const { data: jemna, info: jInfo } = await sharp(Buffer.from(maska), {
    raw: { width: w, height: h, channels: 1 },
  })
    .blur(1.8)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ven = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    const t = jemna[i * jInfo.channels] / 255;
    for (let c = 0; c < 3; c++) {
      ven[i * 3 + c] = Math.round(data[i * k + c] * (1 - t) + ODSTIN_POZADI[c] * t);
    }
  }
  return sharp(ven, { raw: { width: w, height: h, channels: 3 } });
}

/**
 * Kam vodorovne padne dokreslena plocha. 0,5 = clovek uprostred, vic = vic
 * mista NALEVO od nej (posune se doprava), min = naopak.
 *
 * Ma smysl jen u fotek, ktere se dokresluji (viz `TMAVE_POZADI`) - u ostatnich
 * se vyrez bere ze stredu, protoze na nich clovek uprostred uz stoji.
 */
const VODOROVNE = {
  // 1,0 = VSECHNA dokreslena sirka jde nalevo, napravo nic. Presne o to
  // slo: „pridej nalevo 1 cm".
  '09-tomas-leder': 1,
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
  let obrazek = sharp(vstup).rotate();

  const oriz = ORIZ_OKRAJE[id];
  if (oriz !== undefined) {
    // Orez musi predchazet zamene pozadi - jinak by se lem stihl rozmazat
    // do masky a zustal by i po nem.
    const cely = await obrazek.metadata();
    obrazek = sharp(
      await obrazek
        .extract({
          left: oriz.vlevo,
          top: oriz.nahore,
          width: cely.width - oriz.vlevo - oriz.vpravo,
          height: cely.height - oriz.nahore - oriz.dole,
        })
        .toBuffer(),
    );
  }

  if (TMAVE_POZADI[id] !== undefined) obrazek = await ztmavitPozadi(obrazek, TMAVE_POZADI[id]);
  const { width: sirka, height: vyska } = await obrazek.metadata();

  const hlava = HLAVA[id];
  if (hlava === undefined) bezVyrezu++;

  if (hlava !== undefined) {
    const vyskaHlavy = vyska * hlava.vysoka;
    const vyrezNaHlavy = VYREZ_NA_HLAVY_VYJIMKY[id] ?? VYREZ_NA_HLAVY;
    const nadHlavou = NAD_HLAVOU_VYJIMKY[id] ?? NAD_HLAVOU;

    /*
     * Fotka s jednolitym pozadim se smi dokreslit. U ostatnich to nejde -
     * jsou to zabery ze zahrady a dokreslena plocha by byla videt na prvni
     * pohled. Tady je pozadi jedna barva (nahradili jsme ho vys), takze
     * pridany pruh od puvodniho nerozeznate.
     */
    const lzeDokreslit = TMAVE_POZADI[id] !== undefined;

    let vyskaVyrezu = Math.round(vyskaHlavy * vyrezNaHlavy);
    let sirkaVyrezu = Math.round(vyskaVyrezu * POMER);

    if (!lzeDokreslit) {
      // Kdyby vyrez vysel siroci nez fotka, zmensi se cely (i na vysku), aby
      // se nezmenil pomer stran — jinak by `object-fit: cover` v prohlizeci
      // ubral z hlavy a vysledek by se od ostatnich lisil.
      if (sirkaVyrezu > sirka) {
        const zmenseni = sirka / sirkaVyrezu;
        sirkaVyrezu = sirka;
        vyskaVyrezu = Math.round(vyskaVyrezu * zmenseni);
      }
      vyskaVyrezu = Math.min(vyskaVyrezu, vyska);
    }

    const chtene = Math.round(vyska * hlava.temeno - vyskaHlavy * nadHlavou);
    // Zaporne cislo znamena, ze je vyrez sirsi nez fotka a chybejici pruh se
    // dokresli. Podil rozhoduje, kolik z nej pripadne na levou stranu.
    const vlevo = Math.round((sirka - sirkaVyrezu) * (VODOROVNE[id] ?? 0.5));

    if (lzeDokreslit) {
      /*
       * Chybejici pruhy se dokresli barvou pozadi a vyrez se pak vezme
       * z vetsi plochy. Diky tomu ma hlava v ramecku stejnou velikost jako
       * u ostatnich, misto aby se vyrez zarazil o hranu snimku.
       *
       * Mezi `extend` a `extract` se obrazek musi vykreslit do bufferu:
       * sharp poradi operaci nedrzi podle toho, v jakem se zavolaly, a
       * `extract` by se jinak provedl JESTE PRED dokreslenim - tedy na
       * puvodnich rozmerech, kde se nevejde.
       */
      const pridat = {
        top: Math.max(0, -chtene),
        bottom: Math.max(0, chtene + vyskaVyrezu - vyska),
        left: Math.max(0, -vlevo),
        right: Math.max(0, vlevo + sirkaVyrezu - sirka),
      };
      const [r, g, b] = ODSTIN_POZADI;
      const dokreslene = await obrazek
        .extend({ ...pridat, background: { r, g, b } })
        .raw()
        .toBuffer({ resolveWithObject: true });
      obrazek = sharp(dokreslene.data, {
        raw: {
          width: dokreslene.info.width,
          height: dokreslene.info.height,
          channels: dokreslene.info.channels,
        },
      });
      obrazek.extract({
        left: vlevo + pridat.left,
        top: chtene + pridat.top,
        width: sirkaVyrezu,
        height: vyskaVyrezu,
      });
    } else {
      // Kdyby vyrez vysel za okraj fotky, sharp skonci chybou. Radsi ho
      // zarazime u hrany, nez aby spadl cely prevod — ale rekneme o tom:
      // zarazeny vyrez ma nad hlavou min vzduchu nez ostatni a v mrizce
      // portretu to je videt.
      if (chtene < 0) {
        const strop = (hlava.temeno / hlava.vysoka).toFixed(2);
        zarazene.push(`${id} (snizte nad hlavou pod ${strop}, nebo mu uberte z vysky hlavy)`);
      }
      const shora = Math.min(Math.max(0, chtene), Math.max(0, vyska - vyskaVyrezu));
      obrazek.extract({
        left: Math.max(0, vlevo),
        top: shora,
        width: sirkaVyrezu,
        height: vyskaVyrezu,
      });
    }
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
