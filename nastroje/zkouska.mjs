/**
 * Zkouska interaktivnich casti webu: medailonky, filtry, volebni listek a mapa.
 *
 *   npm run zkouska
 *
 * Medailonek je jedina cast webu, ktera si drzi stav a saha do historie
 * prohlizece — a uz jednou se kvuli tomu rozbila: po preskakovani mezi lidmi
 * sel panel zavrit krizkem ani Escapem, protoze kazdy skok pridal zaznam
 * do historie a "zavrit" pak znamenalo "vrat se k predchozimu cloveku".
 *
 * Tahle zkouska hlida, aby se to nevratilo. Potrebuje nainstalovany
 * Microsoft Edge nebo Chrome — zadny prohlizec se nestahuje.
 *
 * Pozor: pred spustenim musi bezet nahled (`npm run nahled`) nebo
 * sestaveny web (`npm run sestavit` a `npm run preview`).
 */

import { chromium } from 'playwright-core';

const ADRESA = process.env.ADRESA ?? 'http://localhost:4321/web-za-kninicky/';

const ZELENA = '\x1b[32m';
const CERVENA = '\x1b[31m';
const ZLUTA = '\x1b[33m';
const KONEC = '\x1b[0m';

let chyb = 0;
let ceka = 0;

function overit(popis, cekano, dostal) {
  const ok = cekano === dostal;
  if (!ok) chyb++;
  const znacka = ok ? `${ZELENA}OK   ${KONEC}` : `${CERVENA}CHYBA${KONEC}`;
  console.log(`${znacka} ${popis}${ok ? '' : `  (cekano: ${cekano}, dostal: ${dostal})`}`);
}

/**
 * Kontrola, ktera ma smysl az na skutecnem obsahu.
 *
 * Nektere veci se daji overit teprve tehdy, kdyz v nich neni placeholder —
 * treba ze podrobny program nese vyrazne vic textu nez odrazky. Dokud tam
 * placeholder je, nesmi to zkousku shodit (nic rozbite neni), ale ani se
 * nesmi tise preskocit: pak by nikdo nepoznal, ze uz se ta vec kontrolovat
 * muze. Proto se vypise zlute a spocita zvlast.
 */
function cekaNaObsah(popis, duvod) {
  ceka++;
  console.log(`${ZLUTA}CEKA ${KONEC} ${popis}  (${duvod})`);
}

/** Spusti prvni prohlizec, ktery je na pocitaci k dispozici. */
async function spustProhlizec() {
  for (const kanal of ['msedge', 'chrome', 'chromium']) {
    try {
      return await chromium.launch({ channel: kanal });
    } catch {
      // zkusime dalsi
    }
  }
  console.log(`${CERVENA}Nenasel jsem Edge ani Chrome. Zkousku nelze spustit.${KONEC}`);
  process.exit(1);
}

const prohlizec = await spustProhlizec();
const stranka = await prohlizec.newPage({ viewport: { width: 1440, height: 900 } });

/** Vrati id otevreneho medailonku, nebo null kdyz je zavreny. */
const otevreny = () =>
  stranka.evaluate(() => document.querySelector('.medailonek.je-otevreny')?.id ?? null);

const skokVpred = async () => {
  await stranka.click('.medailonek.je-otevreny .medailonek-sousede a:last-child');
  await stranka.waitForTimeout(200);
};
const skokVzad = async () => {
  await stranka.click('.medailonek.je-otevreny .medailonek-sousede a:first-child');
  await stranka.waitForTimeout(200);
};

try {
  await stranka.goto(`${ADRESA}lide/`, { waitUntil: 'networkidle' });

  // --- Otevreni a preskakovani -------------------------------------------
  await stranka.click('[data-medailonek="3"]');
  await stranka.waitForTimeout(200);
  overit('otevreni z mrizky', 'medailonek-3', await otevreny());

  await skokVpred();
  await skokVpred();
  await skokVpred();
  overit('tri skoky doprava', 'medailonek-6', await otevreny());

  // --- Zavirani po preskakovani (to, co bylo rozbite) ---------------------
  await stranka.keyboard.press('Escape');
  await stranka.waitForTimeout(300);
  overit('Escape po skakani zavre', null, await otevreny());

  await stranka.click('[data-medailonek="1"]');
  await stranka.waitForTimeout(200);
  await skokVpred();
  await skokVpred();
  await stranka.click('.medailonek.je-otevreny [data-zavrit]');
  await stranka.waitForTimeout(300);
  overit('krizek po skakani zavre', null, await otevreny());

  await stranka.click('[data-medailonek="9"]');
  await stranka.waitForTimeout(200);
  await skokVzad();
  await skokVzad();
  await skokVzad();
  overit('tri skoky doleva', 'medailonek-6', await otevreny());

  await stranka.click('.medailonek.je-otevreny .medailonek-podklad', { position: { x: 20, y: 20 } });
  await stranka.waitForTimeout(300);
  overit('podklad po skakani zavre', null, await otevreny());

  // --- Zpetne tlacitko prohlizece ----------------------------------------
  await stranka.click('[data-medailonek="7"]');
  await stranka.waitForTimeout(200);
  await stranka.goBack();
  await stranka.waitForTimeout(300);
  overit('zpetne tlacitko zavre', null, await otevreny());

  // --- Prichod rovnou s kotvou z uvodni stranky --------------------------
  await stranka.goto(ADRESA, { waitUntil: 'networkidle' });
  await stranka.click('.lide-mrizka [data-medailonek="2"]');
  await stranka.waitForLoadState('networkidle');
  await stranka.waitForTimeout(350);
  overit('prichod z uvodni stranky', 'medailonek-2', await otevreny());

  await skokVpred();
  await stranka.keyboard.press('Escape');
  await stranka.waitForTimeout(300);
  overit('Escape po prichodu s kotvou', null, await otevreny());

  // --- Odpocet do voleb ---------------------------------------------------
  // Odpocet uz jednou mlcky lhal: mirilo se na KONEC voleb misto na zacatek
  // a k tomu se zaokrouhloval nacaty den nahoru, takze misto 35 dnu svitilo
  // 37. Chyba, kterou nikdo nepozna, dokud si to nespocita. Tady se to
  // spocita znovu ze dvou casu, ktere si stranka nese v datech.
  await stranka.goto(ADRESA, { waitUntil: 'networkidle' });
  await stranka.waitForTimeout(300);

  const odpocet = await stranka.evaluate(() => {
    const p = document.querySelector('[data-odpocet-od]');
    return p
      ? { text: p.textContent.trim(), od: p.dataset.odpocetOd, doKdy: p.dataset.odpocetDo }
      : null;
  });

  overit('odpocet je na strance', true, odpocet !== null);

  if (odpocet) {
    overit(
      'odpocet ma smysluplny tvar',
      true,
      /^zbývá \d+ (dny|dní)$|^volby (jsou dnes|jsou zítra|probíhají)$|^po volbách$/.test(odpocet.text),
    );

    // Kalendarni dny v Praze, stejne jako to pocita src/lib/odpocet.ts.
    const den = (d) => {
      const f = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit',
      });
      const [r, m, dd] = f.format(d).split('-').map(Number);
      return Date.UTC(r, m - 1, dd) / 86400000;
    };
    const ted = new Date();
    const od = new Date(odpocet.od);
    const doKdy = new Date(odpocet.doKdy);

    overit('odpocet miri na zacatek voleb, ne na konec', true, od.getTime() < doKdy.getTime());

    let cekano;
    if (ted >= doKdy) cekano = 'po volbách';
    else if (ted >= od) cekano = 'volby probíhají';
    else {
      const dnu = den(od) - den(ted);
      if (dnu <= 0) cekano = 'volby jsou dnes';
      else if (dnu === 1) cekano = 'volby jsou zítra';
      else cekano = `zbývá ${dnu} ${dnu >= 5 ? 'dní' : 'dny'}`;
    }
    overit('odpocet ukazuje spravny pocet dnu', cekano, odpocet.text);
  }

  // --- Program ------------------------------------------------------------
  // Podrobne rozpisy za tlacitkem "Chci vedet vic" na prani tymu zmizely,
  // vcetne stranek /program/<oblast>/. Zbyva zkontrolovat, ze na /program/
  // je kazda oblast vypsana i s odrazkami — to je ted cely program.
  await stranka.goto(`${ADRESA}program/`, { waitUntil: 'networkidle' });
  await stranka.waitForTimeout(300);
  const oblasti = await stranka.locator('.oblast').count();
  overit('program ma nekolik oblasti', true, oblasti >= 2);
  overit('kazda oblast ma odrazky', oblasti,
    await stranka.locator('.oblast-obsah ul').count());

  // --- Volebni listek -----------------------------------------------------
  // Tohle pocita, komu pripadne hlas. Kdyby to pocitalo spatne, ucili bychom
  // lidi volit spatne - proto se kazde pravidlo hlida zvlast.
  await stranka.goto(`${ADRESA}jak-volit/`, { waitUntil: 'networkidle' });

  const vynuluj = () => stranka.click('[data-reset]');
  const hlasu = () => stranka.locator('.radek[data-hlas]').count();
  const ignorovanych = () => stranka.locator('.radek[data-ignorovany]').count();
  const jeNeplatny = async () => (await stranka.locator('[data-listek][data-neplatny]').count()) > 0;
  const oznac = async (klice) => {
    for (const k of klice) await stranka.click(`[data-kandidat="${k}"]`);
  };

  // Kninicky voli 9 zastupitelu a kandiduji dve strany: nase `zk` a `spk`.
  // Cisla nize z toho vychazeji - kdyz se zmeni POCET_ZASTUPITELU, musi se
  // zmenit i tady, jinak by zkouska hlidala neco jineho, nez web ukazuje.
  const NASE = 'zk';
  const DRUHA = 'spolecne-pro-kninicky';
  const POCET = 9;

  await vynuluj();
  await stranka.click(`[data-strana-ramecek="${NASE}"]`);
  await stranka.waitForTimeout(200);
  overit(`jen strana = ${POCET} hlasu`, POCET, await hlasu());

  await vynuluj();
  await oznac([`${NASE}:0`, `${NASE}:5`, `${DRUHA}:2`, `${DRUHA}:0`, `${DRUHA}:8`]);
  await stranka.waitForTimeout(200);
  overit('jen jednotlivci = 5 hlasu', 5, await hlasu());
  overit('jen jednotlivci = zbyvaji 4', '4', await stranka.textContent('[data-zbyva]'));

  // Zakon rika, ze krizky u lidi z oznacene strany se ignoruji.
  await vynuluj();
  await stranka.click(`[data-strana-ramecek="${NASE}"]`);
  await oznac([`${NASE}:6`, `${NASE}:7`, `${NASE}:8`]);
  await stranka.waitForTimeout(200);
  overit(`strana + vlastni lide = porad ${POCET} hlasu`, POCET, await hlasu());
  overit('strana + vlastni lide = 3 ignorovane', 3, await ignorovanych());
  overit('strana + vlastni lide je platny', false, await jeNeplatny());

  // Kombinace: jednotlivci z druhe strany se pocitaji prvni, zbytek jde
  // oznacene strane odshora.
  await vynuluj();
  await stranka.click(`[data-strana-ramecek="${NASE}"]`);
  await oznac([`${DRUHA}:0`, `${DRUHA}:1`, `${DRUHA}:2`]);
  await stranka.waitForTimeout(200);
  overit(`kombinace = ${POCET} hlasu celkem`, POCET, await hlasu());
  overit(
    'kombinace rozdeli 3 + 6',
    true,
    (await stranka.textContent('[data-vysledek-detail]')).includes(`1 až ${POCET - 3}`),
  );

  await vynuluj();
  await stranka.click(`[data-strana-ramecek="${NASE}"]`);
  await stranka.click(`[data-strana-ramecek="${DRUHA}"]`);
  await stranka.waitForTimeout(200);
  overit('dve strany = neplatny', true, await jeNeplatny());

  // Presne tolik jednotlivcu, kolik je zastupitelu, je jeste platne.
  // Kandidatka ma prave 9 jmen, takze devaty krizek se musi vzit z druhe.
  await vynuluj();
  for (let i = 0; i < POCET - 1; i++) await stranka.click(`[data-kandidat="${NASE}:${i}"]`);
  await stranka.click(`[data-kandidat="${DRUHA}:0"]`);
  await stranka.waitForTimeout(200);
  overit(`presne ${POCET} jednotlivcu je platny`, false, await jeNeplatny());
  await stranka.click(`[data-kandidat="${DRUHA}:1"]`);
  await stranka.waitForTimeout(200);
  overit(`${POCET + 1} jednotlivcu = neplatny`, true, await jeNeplatny());

  // --- Mapa zameru ---------------------------------------------------------
  await stranka.goto(`${ADRESA}mapa/`, { waitUntil: 'networkidle' });
  await stranka.waitForTimeout(300);

  // Klika se na PRVNI bod. V sablone to byl bod 14, protoze v centru mesta
  // se odznaky prekryvaly a na zakryty se kliknout nedalo; v Kninickach je
  // bodu zatim jeden a prvni je vzdycky videt. Az jich bude vic a nektery se
  // schova za jiny, vede k nemu seznam vedle mapy.
  await stranka.click('.mapa-bod[data-bod="1"]');
  await stranka.waitForTimeout(400);
  overit('klik do mapy rozbali prave jeden zamer', 1, await stranka.locator('.zamer details[open]').count());

  // Kazdy bod se musi dat otevrit i ze seznamu — na mape se odznaky muzou
  // prekryvat a k zakrytemu vede jedine seznam. Stranka se pred tim znovu
  // nacte: klik do mapy vys uz polozku 1 rozbalil a dalsi klik na summary
  // by ji jen zavrel. Drive to nevadilo, protoze se klikalo na jiny bod,
  // nez ktery se pak otviral ze seznamu — na to uz ale bodu neni dost.
  const vsechnyPolozky = await stranka.locator('.zamer summary').count();
  overit('v seznamu jsou vsechny body', await stranka.locator('.mapa-bod').count(), vsechnyPolozky);

  await stranka.reload({ waitUntil: 'networkidle' });
  await stranka.waitForTimeout(300);
  await stranka.locator('.zamer[data-polozka="1"] summary').click();
  await stranka.waitForTimeout(400);
  overit('bod se otevre ze seznamu', 1,
    await stranka.locator('.zamer[data-polozka="1"] details[open]').count());

  // Filtry se vykresli teprve tehdy, kdyz je na mape vic nez jedna oblast —
  // prepinac mezi „Vse" a jedinou polozkou nic nefiltruje. Dokud je na mape
  // jen zastupny bod, nema tahle kontrola co merit.
  const bodu = await stranka.locator('.mapa-bod').count();
  const jsouFiltry = (await stranka.locator('.mapa-filtry').count()) > 0;
  if (jsouFiltry) {
    const tema = await stranka.locator('.mapa-filtry .filtr:not([data-tema=""])').first().getAttribute('data-tema');
    await stranka.click(`.mapa-filtry .filtr[data-tema="${tema}"]`);
    await stranka.waitForTimeout(300);
    const skrytych = await stranka.locator('.mapa-bod[data-skryty]').count();
    overit('filtr mapy neco skryl', true, skrytych > 0 && skrytych < bodu);
    await stranka.click('.mapa-filtry .filtr[data-tema=""]');
    await stranka.waitForTimeout(300);
  } else {
    cekaNaObsah('filtr mapy neco skryl', 'na mape je zatim jen jedna oblast');
  }

  // Mapa se musi zvetsovat `viewBox`em. Se `transform: scale()` si prohlizec
  // SVG jednou vykresli do bitmapy a tu pak natahuje — z priblizene mapy jsou
  // kosticky. Stejna chyba uz tu byla dvakrat, u teto mapy i u "kde volit".
  const vyrezPred = await stranka.getAttribute('.mapa-plocha svg', 'viewBox');
  await stranka.click('[data-zoom="dovnitr"]');
  await stranka.waitForTimeout(400);
  overit('priblizeni mapy zameru meni viewBox', true,
    vyrezPred !== (await stranka.getAttribute('.mapa-plocha svg', 'viewBox')));
  overit('mapa zameru se nezvetsuje pres transform', true,
    !((await stranka.getAttribute('[data-mapa-vnitrek]', 'style')) ?? '').includes('scale'));

  // Odznaky lezi nad mapou jako HTML, takze se pri priblizeni musi presunout
  // samy — jinak by ukazovaly na uplne jine misto, nez ke kteremu patri.
  const odznakPred = await stranka.getAttribute('.mapa-bod[data-bod="1"]', 'style');
  await stranka.click('[data-zoom="dovnitr"]');
  await stranka.waitForTimeout(400);
  overit('odznaky se pri priblizeni presunou', true,
    odznakPred !== (await stranka.getAttribute('.mapa-bod[data-bod="1"]', 'style')));

  // Vybrany bod musi zustat zvyrazneny i po odjeti mysi. Klik do mapy
  // odroluje na polozku v seznamu, mapa se pohne pod kurzorem a `mouseleave`
  // drive zvyrazneni hned zhaslo — clovek pak nevedel, co si vybral.
  // Filtr se rusi hned po jeho testu vys: kdyz zustane zapnuty, ostatni body
  // maji odebrane `pointer-events` a klik by propadl do mapy pod nimi.
  await stranka.click('[data-zoom="reset"]');
  await stranka.waitForTimeout(300);
  await stranka.click('.mapa-bod[data-bod="1"]');
  await stranka.waitForTimeout(600);
  await stranka.mouse.move(5, 5);
  await stranka.waitForTimeout(400);
  overit('vybrany bod zustane zvyrazneny i po odjeti mysi', 1,
    await stranka.locator('.mapa-bod.je-zvyrazneny').count());

  // Stipnuti dvema prsty musi priblizit mapu, ne celou stranku. Rozhoduje
  // o tom `touch-action`: bez `pan-y` si gesto vezme prohlizec sam.
  const dotyk = (sel) => stranka.$eval(sel, (e) => getComputedStyle(e).touchAction);
  const oddalMapu = async () => {
    const t = stranka.locator('[data-zoom="reset"]');
    if (await t.isEnabled()) {
      await t.click();
      await stranka.waitForTimeout(300);
    }
  };

  await oddalMapu();
  overit('oddalena mapa zameru pusti stipnuti do skriptu', 'pan-y',
    await dotyk('.mapa-plocha'));
  await stranka.click('[data-zoom="dovnitr"]');
  await stranka.waitForTimeout(300);
  overit('priblizena mapa zameru posouva mapu, ne stranku', 'none',
    await dotyk('.mapa-plocha'));
  overit('ostatni body pri vyberu ustoupi', true,
    (await stranka.getAttribute('.mapa-plocha', 'data-zvyraznuji')) !== null);

} finally {
  await stranka.close();
  await prohlizec.close();
}

const ocekava = ceka ? ` (${ceka} kontrol ceka na skutecny obsah)` : '';
console.log(
  chyb
    ? `\n${CERVENA}${chyb} CHYB${KONEC}${ocekava}`
    : `\n${ZELENA}Vse proslo.${KONEC}${ocekava}`,
);
process.exit(chyb ? 1 : 0);
