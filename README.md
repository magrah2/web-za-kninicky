# Web Za Kníničky

Volební web sdružení **Za Kníničky** — nezávislých kandidátů do zastupitelstva
městské části Brno-Kníničky. Volby jsou **9.–10. října 2026**.

Web je statický — žádný server, žádná databáze, žádné cookies ani měřicí kódy.

> **Web je rozpracovaný.** Na místech, kde ještě nemáme text, jsou zástupné
> texty označené slovem „Placeholder". Co všechno zbývá doplnit, je
> v [STAV-PRACE.md](STAV-PRACE.md).

---

## Co kde je

| Složka | Co obsahuje |
|---|---|
| `src/content/kandidati/` | **Kandidáti** — jeden soubor na člověka, tady se vyplňují medailonky |
| `src/content/program/` | **Program** — jedna oblast na soubor, odrážky na stránce `/program/` |
| `src/content/program-detail/` | **Podrobný program** — to, co je za tlačítkem „Chci vědět víc". Jeden soubor na oblast, každý má vlastní stránku. Mít ho nemusí každá oblast — odkaz se objeví jen tam, kde soubor existuje |
| `src/content/zamery/` | **Body na mapě záměrů** — jeden soubor na místo |
| `src/assets/portrety/` | Portrétní fotky, jeden soubor na kandidáta pojmenovaný podle jeho id |
| `src/pages/` | Jednotlivé stránky webu |
| `src/components/` | Opakující se části (hlavička, karta kandidáta, patička…) |
| `src/lib/strana.ts` | **Název strany, počet zastupitelů, datum voleb, e-mail** — jediné místo, kde se tyhle údaje mění |
| `src/styles/tokeny.css` | **Barvy, písmo, rozestupy** — jediné místo, kde se mění vzhled globálně |
| `src/lib/temata.ts` | Seznam programových oblastí, ze kterého čerpá zbytek webu |
| `nastroje/` | Skripty, které vyrábějí logo a podklad mapy, a zkoušky webu |

V každé složce s obsahem leží soubor `_SABLONA.md` — vzor k okopírování.
Soubory začínající podtržítkem se na web nikdy nedostanou.

---

## Jak vyplnit medailonek

Otevřete soubor člověka ve `src/content/kandidati/` — jsou pojmenované podle
pořadí, takže šestý kandidát je `06-milos-steffl.md`.

```
---
poradi: 6
jmeno: MUDr. Miloš Šteffl, Ph.D.
vek: 66
povolani: lékař
pusobeni: zapojení mimo práci — spolky, sdružení
citace: Věta, která se v medailonku vytáhne velkým písmem.
---

Text medailonku. Klidně několik odstavců — dá se překopírovat
z medailonku na Facebooku.
```

Údaje nad čarou (jméno, věk, povolání) jsou opsané z **úřední kandidátní
listiny**, takže se nemají přepisovat — jen doplňovat to, co v listině není:
`pusobeni`, `citace` a text pod čarou.

Pole `prislusnost` má vyplněné jen ten, kdo je členem strany (u nás ODS
nebo KDU-ČSL). Kdo je bez příslušnosti, nechává řádek nevyplněný — nic se
u něj nevypíše.

Nad čarou jsou údaje, pod čarou text. **Prázdné pole nevadí**, stránka se
vykreslí bez něj a nic se nerozbije.

Pár pravidel, která web hlídá sám a upozorní, když se poruší:

- `poradi` musí být vyplněné.

Fotky se do frontmatteru nepíšou vůbec — viz další oddíl.

---

## Jak přidat fotky

Fotky z fotoaparátu mají v původní velikosti klidně několik MB každá a do
gitu nepatří — jinak by si je při každém stažení repozitáře musel stáhnout
úplně každý, i když je nikdy neupravuje. Proto se nejdřív zmenší:

1. Fotku v původní velikosti pojmenujte **stejně jako soubor kandidáta**
   a uložte do `fotky-original/` — třeba fotka Vojtěcha Lišky
   (`20-vojtech-liska.md`) je `fotky-original/20-vojtech-liska.jpg`.
   Tahle složka se do gitu neukládá (viz `.gitignore`).
2. Spusťte `npm run zmensit-fotky`. Skript zmenší všechny fotky ze
   `fotky-original/` na rozumnou velikost a uloží je do
   `src/assets/portrety/` — tuhle složku už web skutečně používá a
   commituje se.

Odtud si web sám vyrobí zmenšeniny pro různé displeje, převede je do
moderních formátů a doplní ořezy — nic dalšího se nemusí nastavovat. Dokud
fotka chybí, ukáže se zástupná silueta.

---

## Jak si web pustit a zveřejnit

Nejjednodušší cesta vede přes **úlohy ve VS Code**: nabídka
**Terminál → Spustit úlohu…** (nebo Ctrl+Shift+P a „Run Task").

| Úloha | Co dělá |
|---|---|
| **0 - Pripravit pocitac** | Doplní vše potřebné. Stačí pustit jednou. Kdyby chyběl Node.js, nabídne se, že ho doinstaluje. |
| **1 - Nahled webu** | Otevře web v prohlížeči. Po uložení souboru se stránka obnoví sama. Zavírá se křížkem u panelu. |
| **2 - Zverejnit web** | Sestaví web, uloží změny a odešle je. Draft se pak do pár minut aktualizuje sám. |

Úloha „1 - Nahled webu" je zároveň výchozí, takže jde spustit i klávesou
**Ctrl+Shift+B**.

Kdo VS Code nemá, může na náhled použít soubor **`NAHLED-WEBU.bat`** —
stačí na něj dvakrát kliknout.

### Kdyby zveřejnění hlásilo chybu

Úloha web nejdřív sestaví a **teprve když se to povede, něco odešle**. Když
sestavení spadne, nic se nezveřejní a v panelu je napsané proč. Nejčastěji
je to překlep v datech — třeba chybějící pořadí, nebo u záměru téma,
které není v seznamu.

### Z terminálu

Když jsou vám bližší příkazy než nabídky:

| Příkaz | Co dělá |
|---|---|
| `npm install` | Jen poprvé — doplní součástky |
| `npm run nahled` | Web běží u vás na počítači, změny se projeví hned |
| `npm run zverejnit` | Sestaví, uloží a odešle |
| `npm run sestavit` | Jen sestaví do složky `dist/` |
| `npm run preview` | Ukáže sestavený web tak, jak ho uvidí návštěvník |
| `npm run zkouska` | Proklikne medailonky a filtry, jestli fungují (musí běžet náhled) |

---

## Nasazení

### Jednorázové nastavení na GitHubu

**Bez tohohle nasazení nepojede.** V repozitáři na GitHubu:

**Settings → Pages → Build and deployment → Source → `GitHub Actions`**

Když je místo toho zvolené *Deploy from a branch*, GitHub se pokusí web
postavit Jekyllem. Ten neumí Astro, začne číst soubory `.astro` jako by to
byla jeho konfigurace a skončí hláškou `Invalid YAML front matter`. Kdyby
se náhodou přece jen prosadil, web by se zobrazil úplně bez formátování —
Jekyll totiž zahazuje složky začínající podtržítkem a Astro do `_astro/`
ukládá všechny styly i písma. Proti tomu je v `public/` prázdný soubor
`.nojekyll`, ale správné nastavení ho nenahradí.

### Jak to pak běží

**Draft** se nasazuje sám. Cokoliv se dostane do větve `main`, se do pár minut
objeví na GitHub Pages. Draft má `noindex` a pruh „Náhled — toto zatím není
živý web", takže se nedostane do vyhledávačů ani si ho nikdo nesplete s ostrým
webem. O nasazení se stará `.github/workflows/nasadit.yml`.

Průběh je vidět na [kartě Actions](https://github.com/magrah2/web-za-kninicky/actions).
Poznat se to dá podle názvu úlohy: má běžet **`Nasadit web`**. Když tam místo
toho svítí *pages build and deployment*, je špatně nastavený zdroj — viz výš.

### Naostro na vlastní doménu (FTP na Wedos)

**Naostro se nikdy nepouští samo.** Draft se aktualizuje při každé změně,
tým si ho projde, a když ho odsouhlasí, pustí se ostré nahrání ručně:

> **Actions → Naostro na FTP → Run workflow → Run workflow**

Jde to i z VS Code, aniž byste chodil na web: v postranním panelu je ikona
**GitHub Actions** (rozšíření `github.vscode-github-actions`, VS Code ho
nabídne k doinstalování sám). V seznamu úloh najděte **Naostro na FTP**
a spusťte ji ikonou ▶ — VS Code se zeptá na tytéž přepínače jako web.

Sestaví se přitom nová verze s `NAOSTRO=1`, takže zmizí pruh „Náhled"
i `noindex` a odkazy se přepnou z podsložky `/web-za-kninicky/` do kořene domény.
Draft na GitHub Pages běží dál a nic se s ním nestane.

**Nejdřív jednou vyplnit přístupy** — Settings → Secrets and variables →
Actions → New repository secret:

| Secret | Co do něj patří |
|---|---|
| `FTP_SERVER` | adresa FTP serveru od Wedosu |
| `FTP_UZIVATEL` | přihlašovací jméno |
| `FTP_HESLO` | heslo |
| `FTP_ADRESAR` | složka s webem, zpravidla `/public_html/` — tahle jediná patří spíš do záložky **Variables** vedle Secrets, viz níž |

`FTP_ADRESAR` musí sedět — je to složka, kterou hosting servíruje jako web,
většinou `/public_html/`. Záleží na tom, protože ostré nahrávání **maže na
serveru soubory, které ve webu nejsou** (jinak by tam po každé změně
zůstávaly staré stránky).

Ve **Variables** (stejná stránka, vedlejší záložka) se nastavuje složka
s webem a případně dvě věci kolem certifikátu. Tajné to není, a proto to
nepatří do Secrets — hodnoty ze Secrets GitHub v záznamu běhu maskuje
hvězdičkami a pak není poznat, co se vlastně stalo.

| Variable | Hodnota | Kdy |
|---|---|---|
| `FTP_ADRESAR` | složka s webem, třeba `/public_html/` | vždy |
| `FTP_KONTROLOVAT_JMENO` | `ne` | jen když se připojení nepovede kvůli certifikátu |
| `FTP_OVERIT_CERTIFIKAT` | `ne` | jen když nepomůže to předchozí |

U těch dvou spodních se **vyplňuje slovo `ne`**, nic jiného. Nechte je
nevyplněné, dokud nahrávání funguje.

K čemu jsou: na sdíleném hostingu bývá certifikát FTP serveru vystavený na
jméno poskytovatele, ne na adresu, přes kterou se připojujete. Spojení je
pak pořád šifrované, jen se neshoduje jméno — a od toho je
`FTP_KONTROLOVAT_JMENO = ne`. Certifikát se dál ověřuje proti certifikační
autoritě, jen se neřeší, na jaké je jméno.

`FTP_OVERIT_CERTIFIKAT = ne` vypne kontrolu úplně. Heslo je i tak
zašifrované, ale nikdo už neručí za to, s kým se spojení navázalo — proto
až jako poslední možnost. Hodnoty ze Secrets GitHub
v záznamu běhu maskuje hvězdičkami, takže by v diagnostickém výpisu nebylo
vidět, kam se vlastně nahrálo. Jako secret to funguje taky, jen se hůř
hledají chyby.

Formulář má proto tři přepínače a stojí za to je projít v tomhle pořadí:

1. **Jen zkušební soubor** — nahraje jediný neškodný textový soubor a vypíše
   obsah složky. Ověří přístupy i adresář, aniž by se na web sáhlo. Ten
   soubor pak jde kdykoliv smazat FTP klientem.
2. **Jen nanečisto** — vypíše, co by se nahrálo a smazalo, ale nic nezmění.
3. Bez přepínačů — ostré nahrání. Poprvé k tomu bude potřeba i **Povolit
   i velký úklid**, protože se běh sám zastaví, když by mazal víc než sto
   souborů.

Proti chybě v adresáři je pojistka: běh si nejdřív nanečisto spočítá, kolik
souborů by smazal, a když jich je sto a víc, zastaví se a vypíše je. Při
prvním nahrání přes starý WordPress to nastane — je to v pořádku, jen se
musí seznam zkontrolovat a spustit znovu se zaškrtnutým **„Povolit i velký
úklid"**.

Ve shrnutí běhu se rozlišuje **smazat** a **přepsat**. Smaže se jen to, co
na serveru je a ve webu už není; přepsání je nová verze téhož souboru, která
hned zase vznikne pod stejným jménem. To číslo bývá vysoké a nic zlého
neznamená. Počítá se to porovnáním seznamu souborů na serveru se seznamem
souborů ve webu, ne čtením hlášek — dokud se počítaly hlášky, hlásila
pojistka smazání celého webu i tehdy, když se nemazalo nic.

### Nastavení serveru je součástí webu

V `public/.htaccess` leží nastavení pro server, na kterém web běží: odkaz na
vlastní stránku 404 a doba, po kterou si smí prohlížeč nechat jednotlivé
soubory. Astro ten soubor při sestavení zkopíruje do `dist/`, takže se nahraje
spolu se zbytkem webu a **přepíše ten, který tam nechal starý WordPress**.

Jsou v něm dvě věci. **Vlastní stránka 404** — bez ní ukáže server svoji
vlastní. A **jak dlouho si smí prohlížeč nechat soubory**: HTML se musí
pokaždé ověřit, protože se jmenuje pořád stejně a jeho obsah se mění, kdežto
soubory z `_astro/` mají v názvu otisk obsahu (`eva-formankova.ClZ1O7_s_1KKFNm.webp`),
takže stejné jméno znamená stejný obsah a smí ležet v mezipaměti rok. Bez
toho si prohlížeč dobu domýšlí a stane se, že telefon ukazuje starou verzi
webu ještě dlouho po úpravě.

Vzor v souboru míří na ten otisk před příponou, ne na složku `_astro/`,
protože `FilesMatch` vidí jen jméno souboru, cestu k němu ne. Soubory
z `public/` jako `mapa-kninicky.svg` ho tedy nesplňují — a je to tak správně,
ty se jmenují pořád stejně a obsah se jim měnit může.

Platí tu jedna zásada: **do souboru se nepřidává direktiva „pro jistotu"**.
Když jí server nerozumí, může přestat číst i to, co následuje. Proto se
to podstatné píše nahoru.

**Pozor: na téhle doméně server `.htaccess` nečte.** Není to nastavením
souboru — ověřeno tak, že do zkušební podsložky přišla nesmyslná direktiva.
Kdyby se soubor četl, server by na tu adresu odpověděl chybou 500; odpověděl
200 a ukázal stránku. Neúčinkují tím pádem ani direktivy v kořeni
(`ErrorDocument`, `Redirect`, `Header` — zkoušené všechny tři), přestože
soubor leží na správném místě, má práva 644 a nic ho nepřebíjí o patro výš.

Příčina je v tom, že doména běží na jiném webserveru než `kvadratura.cz`
u téhož poskytovatele, kde tentýž soubor funguje. Poznat se to dá podle
`ETag` v odpovědi: dvoudílný tvar `"717e-65a87caf79aca"` posílá Apache,
třídílný `"a301-6a98a780-e354f7;;;"` LiteSpeed. Souhlasí s tím i hlavička
`x-turbo-charged-by: LiteSpeed` a psaní názvů hlaviček malými písmeny.
Nejspíš je to pozůstatek toho, že doména byla zřízená pro WordPress.

Řeší se to u poskytovatele — převedením domény na stejné nastavení jako
`kvadratura.cz`. Soubor v repozitáři je napsaný správně a začne fungovat
bez zásahu. Do té doby se ukazuje serverová stránka 404 a mezipaměť si
řídí server sám (posílá `ETag` i `Last-Modified`, takže se prohlížeč
aspoň vždycky doptá).

Jestli se to změnilo, pozná nasazení samo: v `.htaccess` je dočasná sonda
(přesměrování z `/zkouska-htaccess`) a krok „Zkontrolovat nasazený web"
ji hlásí ve shrnutí běhu. Až bude fungovat, sonda se z souboru smaže.

Nahrávat ho ručně nemá smysl — nasazení maže na serveru všechno, co ve webu
není, takže by ho příště smazalo. Když je potřeba na serveru něco nastavit,
patří to do `public/.htaccess`.

### Když se po nahrání nic nezmění

Hosting si drží mezipaměť. Po nahrání proto může ještě chvíli vydávat staré
stránky a vypadá to, že se nahrání nepovedlo.

Než začnete cokoliv opravovat, zkuste tutéž adresu s otazníkem na konci —
třeba `https://zakninicky.cz/?x=1`. Otazník mezipaměť obejde.
Když se přes něj nový web ukáže, je všechno v pořádku a stačí mezipaměť
vyprázdnit v administraci hostingu (nebo počkat, až vyprší).

Stalo se to hned při první zkoušce: nahraný soubor se na adrese bez otazníku
tvářil jako nenalezený, s otazníkem se otevřel bez problémů.

⚠️ **Pozor při přepínání domény:** záznamy `MX` musí zůstat u původního
poskytovatele, jinak přestane chodit pošta na `info@zakninicky.cz`.
To je nejčastější chyba při stěhování webu.

---

## Mapa záměrů

Body na mapě jsou v `src/content/zamery/`, jeden soubor na místo. Nový bod
přidáte tak, že zkopírujete `_SABLONA.md`, pojmenujete kopii
`<číslo>-<nazev>.md` a vyplníte ji — nic dalšího se nikde nevypisuje.
Číslo v názvu určuje jen pořadí; mezery v číslování nevadí a při přidání
nebo odebrání bodu se nic nepřečíslovává.

```
---
nazev: Náves
tema: Zeleň a voda
lat: 49.23660     # zeměpisné souřadnice místa
lon: 16.52700
stav: navrh       # až text potvrdíte, přepište na: overeno
---

Jak to na tom místě vypadá dnes a co tam chceme udělat.
```

Dokud je `stav: navrh`, vykreslí se u bodu oranžová značka „návrh" — aby si
nikdo nespletl podklad k diskuzi se závazkem. Až text potvrdíte, přepište
na `overeno` a značka zmizí.

Zatím je na mapě jediný **zástupný** bod, aby bylo vidět, jak to bude
vypadat. Až přijdou skutečné, `01-placeholder.md` se smaže.

Souřadnice se nejsnáz zjistí na [mapy.cz](https://mapy.cz): pravým tlačítkem
kliknete na místo a vyberete „Souřadnice". Zadávají se zeměpisně, ne v pixelech,
takže když se výřez mapy někdy změní, body se posunou samy.

Když bod omylem umístíte mimo výřez, sestavení se zastaví a napíše který —
lepší, než aby bod potichu zmizel za okrajem.

Podklad mapy je hotový soubor `public/mapa-kninicky.svg` a je v repozitáři,
takže hotový web nikam nesahá — žádná mapová služba, žádné sledování
návštěvníků. Přegenerovat se dá příkazem `npm run mapa`, ale je to potřeba
jen při změně výřezu.

**Výřez drží samotnou ves, ne celý katastr.** Území Kníniček sahá přes
severní polovinu Brněnské přehrady, jenže na takovém záběru je většina
obrázku voda a ves se v ní ztratí. Chatové osady na severním břehu se proto
do mapy nevejdou — kdyby tam bylo potřeba bod, sestavení na to upozorní
a výřez se rozšíří v `nastroje/mapa.mjs`.

Data jsou © přispěvatelé OpenStreetMap, licence ODbL.

---

## Kde se volí

Kníničky mají **jediný volební okrsek**, takže všichni voliči jdou na stejné
místo. Adresa místnosti stojí na stránce `/jak-volit/` v sekci „Kde a kdy" —
mění se v `src/pages/jak-volit.astro` v proměnné `MISTNOST`.

⚠️ **Adresu je nutné opsat z veřejné vyhlášky starosty**, ne z paměti. Poslat
člověka do špatné místnosti je horší než neříct nic. Zatím je tam placeholder.

---

## Logo

Logo je **zástupné** — vzniklo, aby web neměl v hlavičce díru, a klidně se
celé zahodí, až bude vlastní značka. Vyrábí ho `npm run logo`, který zapíše
`public/logo.svg`, `public/favicon.svg` a `src/assets/logo/znak.svg`.

Text v logu je převedený na obrysy, ne na písmo — logo se načítá jako obrázek
a webfont ze stránky se do něj nedostane, takže by se na každém počítači
vysadilo jinak.

---

## Co ještě chybí

Podrobný seznam s cestami k souborům je v [STAV-PRACE.md](STAV-PRACE.md).
Zkráceně:

- [ ] **Program** — všechny oblasti jsou zatím zástupné
- [ ] **Texty medailonků** (kopírují se z Facebooku) a **portréty kandidátů**
- [ ] **Body na mapě** — na mapě je jediný zástupný bod
- [ ] **Heslo strany** a **e-mail** (`src/lib/strana.ts`)
- [ ] **Adresa volební místnosti** podle vyhlášky (`src/pages/jak-volit.astro`)
- [ ] **Údaje do oznámení o transparentnosti** — kontaktní osoba, období, částka
- [ ] **Správce osobních údajů** na stránce `/soukromi/`
- [ ] **Odkazy na sociální sítě** (`src/pages/kontakt.astro`) — dokud jsou
      prázdné, sekce se na webu neukáže
- [ ] **Doména** — zatím je všude zástupná `zakninicky.cz`
- [ ] **Vlastní logo** místo zástupného
