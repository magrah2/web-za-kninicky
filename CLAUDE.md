# Kontext projektu

Volební web sdružení **Za Kníničky** pro volby do zastupitelstva městské části
**Brno-Kníničky**, které se konají **9.–10. října 2026**. Statický web
postavený v Astru, nasazovaný na GitHub Pages.

Návod pro tým je v [README.md](README.md) — tenhle soubor je pro práci na kódu.
Co je rozpracované a co zbývá, drží [STAV-PRACE.md](STAV-PRACE.md).

Web vznikl přeskládáním šablony z volebního webu jiné strany v jiné obci.
Odtud plyne většina toho, co je níž popsané jako zkušenost: šablona měla
27 zastupitelů, dvacet volebních okrsků a jinou značku, a při přenosu se
ukázalo, které z těch věcí byly rozepsané po celém repozitáři.

---

## Píše se česky

Kód, komentáře, názvy proměnných, commity i hlášky skriptů. Do repozitáře
budou sahat i lidé, kteří programovat neumí, a mají mít šanci se v tom vyznat.

Výjimka: klíčová slova jazyka a názvy z Astra (`getCollection`, `Astro.props`).

## Výpisy do terminálu jsou bez diakritiky

Windows konzole běží ve starším kódování a české znaky v ní vycházejí jako
klikyháky. Cokoliv, co skript **tiskne** — hlášky, chybové zprávy, nápovědy —
se píše bez háčků a čárek. Platí to pro `nastroje/*.mjs`, `nastroje/*.ps1`
i dávkové soubory.

Komentáře ve zdroji, texty na webu a zprávy do gitu diakritiku mít mají —
ty se čtou v editoru nebo v prohlížeči, kde se zobrazí správně.

## Komentáře vysvětlují proč, ne co

Kód říká, co dělá. Komentář má říct, proč to tak je — obzvlášť u věcí, které
vypadají jako přehlédnutí. Například:

```css
/* Bez tohohle by `hidden` neúčinkovalo: `display: grid` z třídy přebije
   `display: none`, které prohlížeč atributu `hidden` dává sám. */
.filtry[hidden] { display: none; }
```

## Údaje o straně jsou jen v `strana.ts`

`src/lib/strana.ts` drží název strany, počet zastupitelů, datum voleb,
e-mail, heslo i druhou kandidátku pro zkušební lístek. **Nic z toho se nikde
jinde nesmí napsat natvrdo.**

Není to čistota kvůli čistotě. V šabloně byl počet zastupitelů rozepsaný
ve dvaceti souborech — v textu výkladu, v nadpisech, v popiskách stránek,
ve zkoušce — a při přenosu z jedné obce do druhé z něj část tiše zůstala.
U počtu křížků to není kosmetická chyba: znamenalo by to, že učíme lidi
volit špatně.

Když je někde potřeba tvar, který se ze `strana.ts` poskládat nedá
(skloňování, sazba na dva řádky), napíše se natvrdo — ale s komentářem proč.

## Vzhled se mění jen v tokenech

Barvy, písmo, rozestupy a stíny jsou v `src/styles/tokeny.css`. Nikde jinde
se nesmí objevit natvrdo zapsaná barva. Vzhled jednotlivých částí patří do
`<style>` v příslušné komponentě (Astro je scopuje samo).

Výjimka jsou dvě, obě vynucené: **logo** (`nastroje/logo.mjs`) a **podklad
mapy** (`MapaZameru.astro`). Logo se načítá přes `<img>`, kam se proměnné
z CSS nedostanou, takže barvy musí být v SVG. Mapa má vlastní tmavou paletu,
protože leží na nočním pruhu a tokeny na to odstíny nemají.

**Web je laděný do šedozelené.** Hlavní barva je `--sedozelena` (`#517359`)
a od ní se odvíjí celá stupnice — papír, inkoust, tmavé pásy i linky mají
stejný nádech. Dřív byla hlavní barvou modrá `#1d6eb0` a tokeny se jmenovaly
`--modra*`; přejmenovaly se, aby název barvy nelhal.

Kontrasty v tokenech jsou naměřené, ne odhadnuté, a drží poměry z modré
palety: hlavní text 7,4 : 1, tlumený 6,7 : 1, bílá na tlačítku 5,3 : 1.
Když se odstín mění, první, co spadne pod normu, je `--inkoust-tlum` —
přepočítat, ne hádat.

**Zelená `#5bae39` je barva značky.** Má na světlém pozadí kontrast jen
2,9 : 1 — **na text se nikdy nesmí použít**, od toho je `--zelena-text`.
Platí to i v logu: „Za" je proto tmavší zelenou.

**Barvy témat na přeladění webu nečekaly.** `BARVA_TEMATU` v
`src/lib/temata.ts` má pořád čtyři modré odstíny, takže ikony oblastí na
šedozeleném webu svítí jako cizí prvek. Není to přehlédnutí: tytéž odstíny
nesou odznaky na tmavé mapě, kde si zelené barvy konkurují se zelení
krajiny. Musí se vybrat z variant vykreslených vedle sebe proti mapě,
ne přepsat od stolu.

Výjimkou je **`Komunikace`**, která přibyla jako devátá oblast až po
přeladění a nese rovnou hlavní barvu webu (`#517359`). Je to jediná oblast,
která nemluví o konkrétním místě, ale o způsobu rozhodování — na mapě proto
zatím nemá co označit a proti podkladu se vybírat nemusela.

## Grafika drží pohromadě

**Grafika smí přibývat, ale musí být součástí jedné soustavy, ne sbírkou
klipartů.** Co v soustavě je:

- **Logo** (`nastroje/logo.mjs`) — jen nápis „Za Kníničky", žádný obrázek.
  „Za" je zelené, „Kníničky" tmavě šedozelené. Obrázková značka (kruh
  se zeleným břehem nad modrou hladinou) tu byla do přeladění webu do
  šedozelené; syté modré jezírko v hlavičce pak bylo jediné, co do palety
  nepatřilo.
- **Zelená stopa** (`src/components/Krivka.astro`) — křivka břehu. Původně
  byla vytažená ze zrušené značky, takže dnes už si s logem neodpovídá.
  Na webu se z ní používá jen varianta `oddelovac` (vlna mezi patičkou
  a stránkou); `podklad` a `znacka` nikde. Až se bude řešit grafika,
  je tohle první kandidát na vyhození nebo na nové navázání.
- **Ikony programových oblastí** (`src/components/IkonaTematu.astro`) —
  mřížka 24 × 24, obrys tahem 1,75 a k němu jedna tlumená plocha ve stejné
  barvě, zakulacené konce, `currentColor` obarvený barvou oblasti
  z `BARVA_TEMATU`.
- **Znaky Facebooku a Instagramu** na `/kontakt/` — tam nejde o ozdobu, ale
  o značku, podle které člověk odkaz pozná dřív, než si ho přečte.

Dvě věci platí bez výjimky:

1. **Kreslí se inline v repozitáři, nikdy se nic nestahuje odjinud.** Web
   nesmí posílat požadavky na cizí servery. (Generátory v `nastroje/` si
   stahovat můžou — běží jednou u nás, ne u návštěvníka.)
2. **Barvy jen z palety značky.** Nic mimo `tokeny.css` a `BARVA_TEMATU`.

A ještě jedna zkušenost: **ikonu ani logo nemá smysl posuzovat z kódu.**
Zrušená značka se vybírala z osmi variant vykreslených vedle sebe ve
velikosti hlavičky, hero i na tmavém podkladu. Z první série neobstála ani
jedna: hráz čtená jako miska, kopec jako hřib, plný kotouč jako ikona
aplikace. Z kódu to poznat nešlo.

Totéž platí o **velikosti** loga. Když ze sestavy zmizela značka, zabíral
nápis najednou celou šířku, kterou předtím sdílel s ní — v hlavičce vyrostl
o třetinu a přebil navigaci, v heru stál vedle claimu jako druhý nadpis.
Obojí se muselo stáhnout (`.logo img` a `.hero-logo`) a z kódu to vidět
nebylo: čísla se nezměnila, změnil se obsah obrázku.

## Logo se generuje, nekreslí ručně

`npm run logo` vyrobí `public/logo.svg` a `public/favicon.svg`. Wordmark je
**Montserrat převedený na cesty** — logo se načítá přes `<img>`, kam se
webfont ze stránky nedostane, takže `<text>` by se na každém počítači
vysadilo jiným písmem. Řez musí být týž, jakým je sázený web: kdyby se
změnilo písmo webu a logo ne, byly by v hlavičce dva různé grotesky vedle
sebe.

Favicon je monogram **„ZK"** ve stejných dvou barvách. Celý nápis se do něj
nevejde: na 16 pixelech by z „Za Kníničky" byla šedá šmouha.

`viewBox` loga si generátor **spočítá z obálky písmen**, takže sedí těsně.
Když se nápis změní, změní se i poměr stran — skript ho proto na konci
vypíše a ta dvě čísla patří do `width`/`height` u `<img>` v `Hlavicka.astro`
a `index.astro`. Jsou tam proto, aby stránka při načítání neposkočila.

Řezy Montserratu si generátor stáhne sám do `nastroje/.pisma/` (jsou
v gitignore). Berou se **statické** soubory z fontsource, ne ty variabilní
ze `src/pisma/`: fontkit z variabilního woff2 vrací prázdné glyfy, takže by
z něj nešel dostat jiný řez než Regular.

**Písmo webu se mění na čtyřech místech naráz:** `@font-face` v `tokeny.css`,
`font-family` v `zaklad.css`, `preload` v `Zaklad.astro` a `nastroje/logo.mjs`.
Vynechat kterékoliv z nich se pozná až na hotové stránce, ne při sestavení —
sestavení projde a text se jen tiše vysadí náhradním písmem.

Samotné soubory písma leží v `src/pisma/` a **stahují se jednou do
repozitáře**, nenačítají se z Googlu ani z CDN. Je to důvod, proč web
nepotřebuje cookie lištu.

**Logo je zatím zástupné.** Vzniklo, aby web neměl v hlavičce díru, a klidně
se celé zahodí, až tým dodá vlastní značku. Ryze typografické je na přání
týmu — obrázek k němu zatím žádný nepatří.

## Zásady, které platí všude

1. **Žádné modály na uvítanou, žádná vyskakovací okna.** Detaily se
   rozbalují na místě. Medailonek je jediný překryv a otevírá ho výhradně
   kliknutí uživatele.
2. **Bez JavaScriptu web funguje.** Medailonky otevírá CSS `:target`,
   odkazy jsou skutečné odkazy. Ovládání, které bez JS nefunguje (filtry,
   přibližování mapy), je v HTML `hidden` a odkrývá ho až skript —
   **žádná mrtvá tlačítka**.
3. **Žádné požadavky ven.** Písmo je self-hosted, mapa je vlastní SVG.
   Web nesmí načítat nic z cizích serverů — je to důvod, proč nepotřebuje
   cookie lištu.
4. **Nic vymyšleného se nevydává za program.** Co tým nepotvrdil, musí být
   viditelně označené jako placeholder nebo návrh (`stav: navrh`, komentář
   `# PLACEHOLDER` v datech, slovo „Placeholder" v textu). Na webu strany je
   to důležitější než hezky vypadající náhled.

## ODS a KDU-ČSL jen tam, kde to žádá zákon

Úplný název strany je „Za Kníničky nezávislí kandidáti s podporou ODS
a KDU-ČSL“. V běžném textu se používá **jen „Za Kníničky"** (`NAZEV`);
úplný název (`NAZEV_UPLNY`) patří na tři místa: na zkušební hlasovací
lístek, jako správce osobních údajů — tam ho žádá zákon nebo věcná
správnost — a na úvodní stránku pod údaje o volbách, kam ho na přání týmu
doplnila i podpora obou stran.

Politická příslušnost jednotlivců (ODS u č. 1 a 7, KDU-ČSL u č. 9) se
vypisuje jen v medailonku. Kdo je bez příslušnosti, nemá pole `prislusnost`
vyplněné a nevypisuje se u něj nic — psát „bez politické příslušnosti"
k šesti z devíti lidí by z výjimky udělalo hluk.

## Data hlídá schéma

`src/content.config.ts` popisuje, jak mají data vypadat. Překlep v tématu
nebo chybějící pořadí **shodí sestavení** — to je záměr, chyba se má ukázat
nám, ne návštěvníkovi.

Nevyplněná pole jsou `nullish()`, ne `optional()`. V YAML je `foto:` bez
hodnoty `null`, ne chybějící klíč, a `optional()` by null odmítl — každý
nevyplněný řádek v šabloně by shodil build.

## Odkazy jen přes `odkaz()`

Draft běží v podsložce `/web-za-kninicky/` (musí se jmenovat stejně jako
repozitář na GitHubu), ostrý web bude v kořeni domény. Odkazy psané natvrdo
by po přepnutí vedly vedle. Vždy `odkaz('/lide/')` z `src/lib/odkaz.ts`.

---

## Ověřování

Než něco prohlásím za hotové, musí projít:

```
npm run build            # sestavení nesmí hlásit chybu ani varování
npm run preview          # a pak se na to skutečně podívat
npm run zkouska          # proklikání medailonků, lístku a mapy
npm run zkouska-bez-js   # totéž s vypnutým JavaScriptem
```

Na vzhled se **dívám snímkem obrazovky**, nehádám ho z kódu. V minulosti
takhle vyplavaly chyby, které z kódu vidět nebyly: pořadové číslo přeleze
přes jméno, mezi sekcemi je dvojnásobná mezera, ve jménech zůstaly tečky
po odstraněných titulech, bod na mapě sedí vedle vesnice, voda splývá
s pozadím.

Testuje se i **na šířce 390 px** — na to snímek zatím nikdo nenahradí.

**Kontrola, která má smysl až na skutečném obsahu, se nevypíná — hlásí se
žlutě.** Zkouška má pomocník `cekaNaObsah()`: kdyby se takové kontroly tiše
přeskakovaly, nikdo by nepoznal, že už se ta věc kontrolovat může. Na konci
výpisu je vidět, kolik jich čeká.

**Prázdná kolekce shodí sestavení varováním.** Astro hlásí „No files found
matching …", a to se počítá jako varování. Proto má každá kolekce aspoň
jeden placeholder — až přijde skutečný obsah, placeholdery se smažou.

**Vývojový server umí zapomenout na nově přidaný soubor.** Když se najednou
smažou staré soubory kolekce a přidají nové, běžící `astro dev` se o jednom
z nich nemusí dozvědět: v prohlížeči prostě chybí, zatímco `npm run build`
ho do `dist/` zapíše. Vypadá to jako chyba v kódu a není. Když něco na
`localhost` chybí, ale v `dist/` to je, restartujte server
(`astro dev stop` a `astro dev --background`) — ne hledejte chybu v šabloně.

**Podrobný program je smazaný.** Šablona měla za tlačítkem „Chci vědět víc"
u každé oblasti vlastní stránku s podrobným rozpisem. Tým ho nechtěl:
program jsou odrážky na `/program/` a nic za nimi. Pryč je celá kolekce
`programDetail`, cesta `src/pages/program/[oblast].astro` i obě tlačítka.
Kdyby se to mělo vrátit, je to v historii gitu — ne v mrtvém kódu, stejně
jako `/kde-volit/`.

Bylo to nutné udělat najednou: samotné odstranění tlačítek by nechalo
prázdnou kolekci, a ta hlásí varování.

## Co se z kódu nevyčte

- **Rozestupy sekcí se sčítají.** `.sekce` má odsazení nahoře i dole,
  takže mezi dvěma sousedními je hodnota `--mezera-sekce` dvakrát.
- **`\b` na konci regexu titulů nestačí.** Za `Bc.` následuje mezera a
  hranice slova mezi `.` a ` ` neexistuje, takže tečka ve jméně zůstane.
  Proto `(?=[\s,]|$)`.
- **Delší tituly musí být v regexu před kratšími** (`Ph\.D` před `PhDr`).
- **`arch` je v seznamu titulů samostatně**, protože „Ing. arch." jsou dva
  tituly za sebou, ne jeden. Bez toho zůstalo na kartě „arch. Barbora
  Jelínková". Totéž `MBA` za jménem.
- **Dva kandidáti se jmenují stejně.** Pavel Jankůj je na listině dvakrát
  (č. 1, 64 let a č. 7, 41 let). Není to překlep. Soubory rozlišuje pořadové
  číslo v názvu; v medailonku je odliší jen věk a povolání.
- **`<span>` neunese `<div>`.** Obal portrétu musí být `div`, protože
  komponenta `Portret` vrací blokový prvek.
- **Přeskok mezi medailonky nesmí nafukovat historii.** Zavírací křížek dělá
  krok zpět; kdyby každý skok na dalšího člověka přidal záznam, „zavřít" by
  znamenalo „vrať se k předchozímu" a po delším listování by to vypadalo,
  že panel zavřít nejde. Proto se při přeskoku volá `replaceState`,
  ne `pushState`. Hlídá to `npm run zkouska`.
- **`<details>` už nejde odkrýt přes `display`.** Novější prohlížeče skrývají
  jeho obsah přes `::details-content { content-visibility: hidden }`, takže
  `display: block !important` nestačí. Proto má hlavička dva samostatné prvky:
  vypsané odkazy pro široký displej a `<details>` pro úzký. Kvůli tomuhle
  navigace na počítači jednou zmizela úplně.
- **Písma patří do `src/`, ne do `public/`.** Odkaz `url('/pisma/…')` v CSS
  by na draftu mířil vedle, protože ten běží v podsložce. Relativní cesta
  ze `src/` si nechá adresu dopočítat od Astra. Adresy pro `preload` se ze
  stejného důvodu importují přes `?url` — jinak by preload stahoval jiný
  soubor, než jaký si pak vyžádá CSS.

## Odpočet do voleb

`src/lib/odpocet.ts` skládá text „zbývá N dní / volby probíhají / po volbách".
Počítá se **dvakrát** — při sestavení (aby stránka měla správný text i bez
JavaScriptu) a pak znovu v prohlížeči, aby číslo nezestárlo mezi nasazeními.
Proto je to samostatný soubor, který si importuje frontmatter i klientský
skript: opsané na dvou místech by se to rozešlo, a nejspíš by se rozešla ta
větev, kterou vidí jen návštěvník bez skriptu.

Dvě věci, na kterých to už jednou selhalo:

- **Odpočet míří na `ZACATEK_VOLEB`, ne na konec.** Když mířil na konec,
  v pátek odpoledne — kdy už se hodinu volilo — svítilo na webu „zbývá
  1 den". Mezi začátkem a koncem se ukazuje „volby probíhají"; kdyby byl
  v datech jen jeden čas, jeden ze dvou volebních dnů by se do odpočtu
  nevešel.
- **Počítají se kalendářní dny v Praze, ne hodiny.** „Zbývá 5 dní" má
  znamenat pět přespání. Na rozdílu hodin se to pletlo dvakrát: `Math.ceil`
  zaokrouhlil načatý den nahoru (z 35 dnů bylo 37) a v pátek půl hodiny před
  otevřením místností z toho vyšlo „volby jsou zítra". Zóna je natvrdo
  `Europe/Prague`, ne zóna prohlížeče — datum se má počítat podle Kníniček
  i tomu, kdo se dívá z Kanady.

Hlídá to `npm run zkouska`: přepočítá si počet dnů z časů, které si stránka
nese v `data-odpocet-od` a `data-odpocet-do`.

## Mapa záměrů

- **Body se ukládají jako `lat`/`lon`, ne jako procenta.** Procenta platí jen
  pro jeden výřez; po změně výřezu by se všechny rozjely. Přepočet dělá
  `src/lib/mapa.ts` podle `mapa-vyrez.json`, který zapisuje generátor —
  jeden zdroj pravdy.
- **Bod mimo výřez shodí sestavení** s hláškou, která řekne které a kam.
  Je to záměr: bod za okrajem by se vykreslil tam, kde ho nikdo neuvidí.
- **Velké vodní plochy jsou v OpenStreetMap relace, ne cesty.** Brněnská
  přehrada je multipolygon, takže dotaz jen na `way` ji nenajde — v mapě pak
  místo jezera zbyla jen linka Svratky, která jím protéká, a vypadalo to jako
  chyba vykreslení. Generátor proto stahuje i `rel` a skládá z členů uzavřené
  prstence (`prstence()` v `nastroje/mapa.mjs`).
- **Prstence jedné relace patří do jediné cesty**, jinak by `fill-rule="evenodd"`
  nemělo z čeho udělat díru a ostrovy by se vykreslily jako voda.
- **Plochy se na okraji neořezávají, jen se celé zahodí, když leží mimo.**
  Ořezání je v generátoru kvůli velikosti souboru u linek, které z výřezu
  odbíhají. U výplně ale rozstříhání obrysu na úseky znamená, že se plocha
  nemá čím uzavřít — z přehrady přesahující severní okraj by zbyl pruh podél
  břehu místo jezera. SVG si to, co je za `viewBox`em, ořízne samo.
- **Výřez drží samotnou ves, ne celý katastr.** Území městské části sahá přes
  severní polovinu přehrady až k 49.283; na takovém záběru je většina obrázku
  voda, ves se v ní ztratí a při levém okraji začne vykukovat sousední
  Rozdrojovice. Západní a severní hrana je navíc utažená proti vodní ploše
  a lánům — velké jednolité plochy se čtou jako prázdné místo a ves v záběru
  zbytečně ztrácela na velikosti. Chatové osady na severním břehu se do
  výřezu nevejdou; až bude potřeba bod i tam, sestavení na to samo upozorní.
- **Krajina se stahuje taky, i když se „nic neděje".** Pole a les žádný jiný
  tag nemají, takže bez nich byla víc než polovina výřezu prázdná tmavá
  plocha a z mapy nešlo poznat, kde ves končí. Přidání `landuse=forest`,
  `farmland`, `natural=wood` a spol. mapu proměnilo víc než jakékoliv
  ladění barev.
- **Klíč mezipaměti generátoru je celý dotaz, ne jen výřez.** Když byl jen
  výřez, doplnění nových tagů se tiše ignorovalo: data se načetla uložená,
  mapa se vykreslila bez nich a vypadala v pořádku. Tohle je přesně ta
  chyba, kterou nejde poznat.
- **Obrys se prořeďuje** (`proredit()`, krok 1,5 jednotky ≈ 3 m). Lesní
  polygony z OpenStreetMap mají přes tisíc bodů; bez prořezání narostl
  soubor mapy pětinásobně.
- **Modrá na mapě znamená vodu, nic jiného.** Zástavba je proto šedá, ne
  modrošedá — s modrým odstínem se plocha vsi dala na první pohled splést
  s hladinou. Je to výjimka z pravidla „barvy jen z palety značky": paleta
  má samu modrou a zelenou, jenže obojí už na mapě něco znamená.
- **Zeleň krajiny musí být tlumená.** V jasnějších variantách si les
  konkuroval se zelenými odznaky z `BARVA_TEMATU` a mapa přestala říkat,
  co je bod a co les.
- **Řeka nesmí být zelená.** V šabloně byla zvýrazněná zelenou, protože tam
  šlo o řeku, kterou program sliboval zpřístupnit. Tady je to Svratka
  protékající přehradou a zelená čára napříč vodní plochou vypadala jako
  chyba.
- **Paleta mapy se vybírá z variant vykreslených vedle sebe**, s odznaky ve
  všech barvách z `BARVA_TEMATU`. Z kódu se to posoudit nedá — tři ze čtyř
  variant vypadaly v kódu stejně rozumně a na obrázku byly nepoužitelné.
- **Mapa se zvětšuje `viewBox`em, ne `transform: scale()`.** Se `scale()` si
  prohlížeč SVG jednou vykreslí do bitmapy a tu pak natahuje — při přiblížení
  z toho byly kostičky. Značky nad mapou jsou HTML a polohu si přepočítávají
  podle `viewBox`u. Hlídá to `npm run zkouska`.
- **Odznaky se nerozestrkávají a můžou se překrývat.** Je to záměr. Dřív je
  rozestrkávala funkce, která u bodů blízko sebe posunula značku o stovky
  metrů, tedy mimo místo, které označuje. Přesná poloha je důležitější než
  mezera mezi odznaky: kdo chce mít mezi nimi místo, přiblíží si mapu,
  a vybraný bod se stejně vytáhne dopředu (`z-index` u `.je-zvyrazneny`).

## Pravidla hlasování jsou ověřená — neměnit od oka

Volební lístek (`src/components/VolebniListek.astro`) počítá, komu připadne
hlas. Kdyby počítal špatně, učili bychom lidi volit špatně. Pravidla jsou
ověřená proti zákonu č. 491/2001 Sb. a shodně je popisuje Ministerstvo vnitra:

1. Křížek u strany → hlas dostanou **všichni** její kandidáti v pořadí.
2. Křížky u jednotlivců → nejvýš 9 (tolik má Brno-Kníničky zastupitelů).
3. Strana + jednotlivci z **jiné** strany → nejdřív se počítají jednotlivci,
   zbytek z 9 hlasů dostanou kandidáti označené strany **odshora**.
4. Strana + jednotlivci z **téže** strany → křížky u jednotlivců se
   **ignorují**, hlas platí pro celou stranu. Lístek zůstává platný.
5. Neplatný → víc než jedna strana, nebo víc než 9 jednotlivců.

Počet se bere z `POCET_ZASTUPITELU` ve `strana.ts`, nikde se nepíše natvrdo.
Každé z těch pravidel hlídá `npm run zkouska`. Když se logika mění, musí se
měnit i zkouška — ne naopak.

**Na lístku jsou obě skutečné kandidátky včetně jmen.** V šabloně byly
zástupné („Ukázková kandidátka A") s odůvodněním, že jmenovat konkurenci
vypadá jako útok. V Kníničkách kandidují jen dvě strany, takže zástupná
kandidátka by lístek naopak zkreslila — volič by si nanečisto vyzkoušel jiný
lístek, než jaký pak najde v obálce, a přitom právě u kombinace „strana
+ jednotlivci z jiné strany" se nejčastěji chybuje. Jména jsou z úřední
kandidátní listiny, která je ze zákona veřejná, a lístek je nekomentuje.

## Kníničky mají jediný volební okrsek

Šablona měla vlastní stránku `/kde-volit/` s vyhledávačem podle adresy —
byla psaná pro obec s dvaceti okrsky, kde by člověk ten svůj jinak nenašel.
Tady by vyhledávač všem odpověděl stejně, takže stránka i celý generátor
okrsků (data ČÚZK, převod ze S-JTSK) jsou **smazané**. Adresa místnosti
stojí rovnou v sekci „Kde a kdy" na `/jak-volit/`.

Kdyby se to někdy mělo vrátit, je to v historii gitu — ne v mrtvém kódu.

---

## Astro

Dokumentace: https://docs.astro.build

Vývojový server se spouští na pozadí: `astro dev --background`
(ovládá se `astro dev stop`, `status`, `logs`). Totéž umí `astro preview` —
a pozor, když už jeden běží, další se nespustí a jen ohlásí port toho
běžícího (klidně jiný, než jaký jste zadali).
