/**
 * Vyrobi podkladovou mapu jako SVG:  node nastroje/mapa.mjs
 *
 * Data se stahuji z OpenStreetMap pres Overpass API. Delaji se JEDNOU
 * a vysledek se commituje, takze hotovy web uz nikam nesaha - zadna mapova
 * sluzba, zadne trackovani navstevniku, zadne cekani na cizi server.
 *
 * Vyrez odpovida hranici mestske casti Brno-Kninicky podle OpenStreetMap
 * (relace 20398991), s malym okrajem, aby uzemi nesedelo tesne u hrany.
 * Do vyrezu se tim padem vejde i cela knininicka cast Brnenske prehrady,
 * ktera tvori vetsinu katastru - bez ni by mapa nedavala smysl.
 *
 * Kninicky maji jediny volebni okrsek, takze druha mapa (uzemi obce pro
 * vyhledavac volebnich mistnosti) tu na rozdil od puvodni sablony neni.
 *
 * SVG zamerne neobsahuje zadne barvy. Vsechno se obarvuje az v CSS pres tridy,
 * aby mapa sedla do tmaveho pasu i na svetle pozadi.
 *
 * Data (c) prispevatele OpenStreetMap, licence ODbL.
 */

import fs from 'node:fs';
import path from 'node:path';

const SIRKA = 1000;

const MAPY = [
  {
    nazev: 'kninicky',
    // Vyrez drzi SAMOTNOU VES, ne cely katastr. Uzemi mestske casti saha
    // pres severni polovinu Brnenske prehrady az k 49.283 a na takovem
    // zaberu je vetsina obrazku voda, ves se v nem ztrati a pri levem okraji
    // zacne vykukovat sousedni Rozdrojovice. Zastavba samotnych Kninicek lezi
    // podle OpenStreetMap mezi 49.2313-49.2406 a 16.5182-16.5316; vyrez ji
    // obepina s okrajem.
    //
    // Zapadni a severni hrana je jeste o desetinu utahnuta proti vodni plose
    // a polim: prehrada i lany na severu se daly cist jako prazdne misto
    // a ves tim v zaberu zbytecne ztracela na velikosti. Z prehrady zustava
    // pruh podel breznu, coz na zarazeni mapy staci.
    //
    // Cely vyrez je pak posunuty o 0,0025 stupne na zapad. Duvod je Sokolske
    // koupaliste (16.5137): pri utazene hrane 16.5125 sedel jeho odznak
    // pet procent od leve strany mapy, tedy prakticky na ramu. Sirka vyrezu
    // zustala skoro stejna, aby se ves nezmensila — misto rozsireni na zapad
    // se o stejny kus utahla vychodni hrana, kde za vsi (konci na 16.5316)
    // zbyva uz jen les.
    //
    // Posouvat dal na zapad uz nema smysl: pri 16.5085 se odznak dostal do
    // ctvrtiny sirky, ale ves se odsunula k pravemu okraji a vlevo dole
    // zustala jen jednolita vodni plocha bez obsahu.
    //
    // Chatove osady na severnim brehu (kolem 49.2485-49.2584) se do vyrezu
    // nevejdou. Az bude potreba bod i tam, sestaveni na to samo upozorni
    // (MapaZameru.astro hlida, ze kazdy bod lezi uvnitr) a vyrez se rozsiri.
    vyrez: { jih: 49.2295, sever: 49.2444, zapad: 16.5100, vychod: 16.5360 },
    svg: 'public/mapa-kninicky.svg',
    json: 'src/lib/mapa-vyrez.json',
  },
];

// --- Roztrideni do vrstev --------------------------------------------------

/** Otevrena krajina: pole, louky, pastviny, zahradkarske kolonie, krovi. */
const POLE = new Set(['farmland', 'meadow', 'orchard', 'vineyard', 'grass', 'allotments']);
const POLE_PRIRODA = new Set(['grassland', 'scrub', 'heath']);

/**
 * Ulice, po kterych se v obci jmenuje adresa.
 *
 * `living_street` (obytna zona) je tu podstatna: v Kninickach je takhle
 * oznacenych 25 pojmenovanych ulic, tedy skoro polovina ulicni site.
 * Drive se nestahovala vubec a ve vsi kvuli tomu chybela vetsina cest,
 * podle kterych se clovek orientuje.
 */
const ULICE = new Set(['residential', 'unclassified', 'living_street', 'pedestrian']);

/**
 * Cesticky: prijezdy k domum, pesiny, polni cesty, schody.
 *
 * Kresli se tence a tlumene. Jsou to ctyri patiny vsech cest v datech,
 * takze v plne sile by z mapy byla pavucina a ulice by v ni zmizely —
 * ale bez nich zas nejde poznat, kudy se k mistu vlastne dostanete.
 */
const CESTICKY = new Set(['service', 'track', 'footway', 'path', 'cycleway', 'steps']);

/**
 * Do ktere vrstvy prvek patri, nebo `null`, kdyz se nekresli.
 *
 * Poradi podminek neni libovolne. Drive se testoval `landuse` jako prvni
 * a cokoliv jineho nez `residential` padlo do vrstvy `prumysl` - takze les
 * i pole by se vykreslily jako prumyslova zona. Nejdriv se proto pozna
 * voda, cesty a zelen a teprve nakonec zbyva `landuse` jako prumysl.
 */
function vrstva(prvek) {
  const t = prvek.tags ?? {};
  if (t.natural === 'water') return 'vodni-plocha';
  if (t.waterway === 'river') return 'reka';
  if (t.waterway) return 'potok';
  if (t.railway) return 'zeleznice';
  if (['motorway', 'trunk', 'primary'].includes(t.highway)) return 'silnice-hlavni';
  if (['secondary', 'tertiary'].includes(t.highway)) return 'silnice';
  if (ULICE.has(t.highway)) return 'ulice';
  if (CESTICKY.has(t.highway)) return 'cesticka';
  if (t.highway) return 'ulice';
  if (t.leisure) return 'zelen';
  if (t.landuse === 'residential') return 'zastavba';
  if (t.landuse === 'forest' || t.natural === 'wood') return 'les';
  if (POLE.has(t.landuse) || POLE_PRIRODA.has(t.natural)) return 'pole';
  if (t.landuse) return 'prumysl';
  return null;
}

const PLOCHY = new Set(['pole', 'les', 'zastavba', 'prumysl', 'zelen', 'vodni-plocha']);

/**
 * Slozi z casti relace uzavrene prstence.
 *
 * Multipolygon je v OpenStreetMap poskladany z cest, ktere na sebe navazuji
 * koncovymi body, ale nejsou serazene ani nemaji jednotny smer. Bez tohohle
 * kroku by z prehrady zbyla hrst nesouvislych oblouku.
 *
 * Vnitrni prstence (ostrovy) se nijak neodlisuji - vykresluji se stejne jako
 * vnejsi a diru z nich udela az `fill-rule="evenodd"` v SVG.
 */
function prstence(casti) {
  const stejny = (a, b) => a.lat === b.lat && a.lon === b.lon;
  const zbyva = casti.filter((c) => c.length > 1).map((c) => c.slice());
  const hotove = [];

  while (zbyva.length) {
    let prstenec = zbyva.pop();
    let navazano = true;
    while (navazano && !stejny(prstenec[0], prstenec.at(-1))) {
      navazano = false;
      for (let i = 0; i < zbyva.length; i++) {
        const cast = zbyva[i];
        if (stejny(prstenec.at(-1), cast[0])) prstenec = prstenec.concat(cast.slice(1));
        else if (stejny(prstenec.at(-1), cast.at(-1))) prstenec = prstenec.concat(cast.slice(0, -1).reverse());
        else if (stejny(prstenec[0], cast.at(-1))) prstenec = cast.slice(0, -1).concat(prstenec);
        else if (stejny(prstenec[0], cast[0])) prstenec = cast.slice(1).reverse().concat(prstenec);
        else continue;
        zbyva.splice(i, 1);
        navazano = true;
        break;
      }
    }
    hotove.push(prstenec);
  }
  return hotove;
}

/** Poradi vykreslovani: co je vys v seznamu, to je vespod. */
const PORADI = [
  // Krajina jako podmalba. Bez ni je vetsina vyrezu prazdna tmava plocha,
  // protoze pole a les zadny jiny tag nemaji - a z mapy pak nejde poznat,
  // kde ves konci a kde zacina okoli.
  'pole', 'les',
  'zastavba', 'prumysl', 'zelen', 'vodni-plocha',
  'cesticka', 'ulice', 'zeleznice', 'silnice', 'silnice-hlavni',
  'potok', 'reka',
];

// --- Stazeni dat -----------------------------------------------------------

async function stahniData(mapa) {
  const mezipamet = `nastroje/.mapa-data-${mapa.nazev}.json`;
  const v = mapa.vyrez;
  const bbox = `${v.jih},${v.zapad},${v.sever},${v.vychod}`;

  // Plochy se stahuji i jako relace. Velke vodni plochy jsou v OpenStreetMap
  // temer vzdy multipolygony (Brnenska prehrada je relace, ne cesta), takze
  // dotaz jen na `way` je nenajde - v mape pak misto jezera zbyde jen cara
  // reky, ktera jim protece, a vypada to jako chyba.
  const KRAJINA = 'forest|farmland|meadow|orchard|vineyard|grass|allotments';
  const PRIRODA = 'wood|grassland|scrub|heath';
  const dotaz = `[out:json][timeout:180];
(
  way["landuse"~"^(residential|industrial|commercial|retail|${KRAJINA})$"](${bbox});
  way["natural"~"^(water|${PRIRODA})$"](${bbox});
  way["leisure"~"^(park|garden)$"](${bbox});
  way["waterway"~"^(river|stream)$"](${bbox});
  way["railway"="rail"](${bbox});
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|pedestrian|service|track|footway|path|cycleway|steps)$"](${bbox});
  rel["landuse"~"^(residential|industrial|commercial|retail|${KRAJINA})$"](${bbox});
  rel["natural"~"^(water|${PRIRODA})$"](${bbox});
  rel["leisure"~"^(park|garden)$"](${bbox});
);
out geom;`;

  // Klic mezipameti je CELY dotaz, ne jen vyrez. Drive to byl jen vyrez
  // a doplneni novych tagu (les, pole) se tise ignorovalo: data se nacetla
  // ulozena, mapa se vykreslila bez nich a vypadala v poradku. Cely dotaz
  // v klici znamena, ze kazda zmena v tom, co se stahuje, vynuti nove
  // stazeni.
  const klic = dotaz;

  if (fs.existsSync(mezipamet)) {
    const ulozene = JSON.parse(fs.readFileSync(mezipamet, 'utf8'));
    if (ulozene.klicDotazu === klic) {
      console.log('   pouzivam ulozena data z ' + mezipamet);
      return ulozene;
    }
    console.log('   dotaz nebo vyrez se zmenil, stahuji data znovu');
  }

  console.log('   stahuji data z OpenStreetMap...');
  // Overpass odmita pozadavky bez hlavicky User-Agent (odpovi 406),
  // takze se slusne predstavime.
  const odpoved = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'zakninicky.cz generator mapy (jednorazove)',
    },
    body: new URLSearchParams({ data: dotaz }),
  });
  if (!odpoved.ok) throw new Error('Overpass odpovedel ' + odpoved.status);
  const data = await odpoved.json();
  data.klicDotazu = klic;
  fs.writeFileSync(mezipamet, JSON.stringify(data));
  console.log('   ulozeno do ' + mezipamet + ' (' + data.elements.length + ' prvku)');
  return data;
}

// --- Vyroba jedne mapy -----------------------------------------------------

async function vyrobMapu(mapa) {
  console.log('\n>> Mapa "' + mapa.nazev + '"');
  const data = await stahniData(mapa);
  const v = mapa.vyrez;

  // Mercator: pri tehle velikosti by stacila i primka, ale spravna projekce
  // stoji tri radky a mesto pak nevypada natazene na vysku.
  const merkator = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2));
  const yJih = merkator(v.jih);
  const meritko = SIRKA / (v.vychod - v.zapad);
  const vyska = Math.round((merkator(v.sever) - yJih) * (180 / Math.PI) * meritko);

  const bod = (p) => [
    Math.round((p.lon - v.zapad) * meritko * 10) / 10,
    Math.round((vyska - (merkator(p.lat) - yJih) * (180 / Math.PI) * meritko) * 10) / 10,
  ];

  // Body daleko za vyrezem se zahazuji a cesta se v tom miste pretrhne,
  // aby dalnice mirici pryc netahla do souboru stovky zbytecnych souradnic.
  const okraj = SIRKA * 0.2;
  const uvnitr = ([x, y]) => x > -okraj && x < SIRKA + okraj && y > -okraj && y < vyska + okraj;

  /**
   * Plocha se na okraji NEOREZAVA, jen se zahodi cela, kdyz lezi mimo.
   *
   * Orezani je tu kvuli velikosti souboru u car, ktere z vyrezu odbihaji
   * pryc. U vyplne ale rozstrihani obrysu na useky znamena, ze se plocha
   * nema cim uzavrit - prehrada presahuje severni okraj a po rozstrihani
   * by z ni zbyl pruh podel brehu misto jezera. SVG si to, co je za
   * viewBoxem, orizne samo.
   */
  /**
   * Prored obrys: vyhodi body, ktere lezi bliz nez `KROK` od posledniho
   * ponechaneho.
   *
   * Jen zaokrouhleni na desetiny nestacilo. Lesni obrysy z OpenStreetMap
   * maji pres tisic bodu na jeden polygon a po pridani krajiny narostl
   * soubor mapy petinasobne. `KROK` je v jednotkach mapy, kde 1000 jednotek
   * je 2,2 km — 0,8 jednotky jsou necele dva metry, tedy pod rozlisenim
   * obrazovky i pri nejvetsim priblizeni.
   *
   * Posledni bod se drzi vzdycky, aby se plocha mela cim uzavrit.
   */
  const KROK = 1.5;
  function proredit(body) {
    if (body.length < 3) return body;
    const drzene = [body[0]];
    for (let i = 1; i < body.length - 1; i++) {
      const posledni = drzene[drzene.length - 1];
      const dx = body[i][0] - posledni[0];
      const dy = body[i][1] - posledni[1];
      if (dx * dx + dy * dy >= KROK * KROK) drzene.push(body[i]);
    }
    drzene.push(body[body.length - 1]);
    return drzene;
  }

  function plocha(geometrie) {
    const body = geometrie.map(bod);
    // Plocha, ktera vyrez cely obklopuje, nemusi mit uvnitr ani jeden bod -
    // treba les, jehoz obrys vede kolem dokola za okrajem. Proto se vedle
    // bodu testuje i to, jestli jeji obalka nepokryva stred mapy.
    const xs = body.map((b) => b[0]);
    const ys = body.map((b) => b[1]);
    const obklopuje =
      Math.min(...xs) < SIRKA / 2 && Math.max(...xs) > SIRKA / 2 &&
      Math.min(...ys) < vyska / 2 && Math.max(...ys) > vyska / 2;
    if (!body.some(uvnitr) && !obklopuje) return '';
    const cistne = proredit(body);
    if (cistne.length < 3) return '';
    return 'M' + cistne.map((b) => b.join(',')).join('L') + 'Z';
  }

  function cesta(geometrie, uzavrena) {
    if (uzavrena) return plocha(geometrie);
    const useky = [];
    let usek = [];
    for (const g of geometrie) {
      const b = bod(g);
      if (uvnitr(b)) usek.push(b);
      else if (usek.length) {
        usek.push(b); // jeden bod za okrajem, at cara dojede ke kraji
        useky.push(usek);
        usek = [];
      }
    }
    if (usek.length) useky.push(usek);

    return useky
      .map((body) => {
        // Vyhodit body, ktere po zaokrouhleni splynuly se sousedem
        const cistne = proredit(body);
        if (cistne.length < 2) return '';
        const d = 'M' + cistne.map((b) => b.join(',')).join('L');
        return uzavrena ? d + 'Z' : d;
      })
      .filter(Boolean)
      .join('');
  }

  const skupiny = Object.fromEntries(PORADI.map((n) => [n, []]));
  for (const prvek of data.elements) {
    const n = vrstva(prvek);
    if (!skupiny[n]) continue;

    if (prvek.type === 'relation') {
      // Prstence jedne relace patri do JEDINE cesty. Zapsane zvlast by
      // `evenodd` nemelo z ceho udelat diru a ostrovy by prehradu prekryly.
      const casti = (prvek.members ?? [])
        .filter((m) => m.type === 'way' && m.geometry)
        .map((m) => m.geometry);
      const d = prstence(casti).map(plocha).filter(Boolean).join('');
      if (d) skupiny[n].push(d);
      continue;
    }

    if (!prvek.geometry || prvek.geometry.length < 2) continue;
    const d = cesta(prvek.geometry, PLOCHY.has(n));
    if (d) skupiny[n].push(d);
  }

  // `evenodd` u ploch: ostrov uvnitr jezera je dalsi prstenec teze cesty
  // a bez tohohle pravidla by se vykreslil jako voda, ne jako dira.
  const casti = PORADI.filter((n) => skupiny[n].length).map(
    (n) =>
      `  <g class="mapa-${n}"${PLOCHY.has(n) ? ' fill-rule="evenodd"' : ''}>\n` +
      skupiny[n].map((d) => `    <path d="${d}"/>`).join('\n') +
      '\n  </g>',
  );

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIRKA} ${vyska}" aria-hidden="true" focusable="false">
<!-- Podklad vygenerovany skriptem nastroje/mapa.mjs - needitovat rucne.
     Data (c) prispevatele OpenStreetMap, licence ODbL. -->
${casti.join('\n')}
</svg>
`;

  fs.mkdirSync(path.dirname(mapa.svg), { recursive: true });
  fs.writeFileSync(mapa.svg, svg);

  // Vyrez si ukladame vedle mapy. Body zameru jsou v datech ulozene jako
  // zemepisne souradnice a web si z nich polohu na mape dopocita prave podle
  // tohohle souboru — takze kdyz se vyrez zmeni, body se posunou samy.
  fs.writeFileSync(mapa.json, JSON.stringify({ ...v, sirka: SIRKA, vyska }, null, 2) + '\n');

  console.log('   ' + mapa.svg + '  (' + SIRKA + ' x ' + vyska + ', ' + Math.round(svg.length / 1024) + ' kB)');
  console.log('   ' + mapa.json);
  for (const n of PORADI) if (skupiny[n].length) console.log('     ' + n.padEnd(16) + skupiny[n].length);
}

for (const mapa of MAPY) await vyrobMapu(mapa);
console.log('\nHotovo.');
