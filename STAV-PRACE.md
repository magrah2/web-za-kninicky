# Kde jsme skončili

Rozpracovaný přenos šablony z webu jiné strany na **Za Kníničky**.
Tenhle soubor je poznámka pro pokračování — až bude práce hotová, smažte ho.

Stav k 4. 9. 2026.

---

## Hotovo

**Obsah po předchozí straně je pryč.** Kandidáti, program, body na mapě,
portréty, logo, stránka „Kde volit" i její generátor okrsků. V repozitáři
nezůstal žádný text ani soubor po ní — včetně dokumentace.

**Kandidáti** — všech 9 je v `src/content/kandidati/`, opsaných z úřední
kandidátní listiny (jméno s tituly, věk, povolání, u tří i politická
příslušnost). Medailonky a fotky chybí, karta se bez nich vykreslí.

**Údaje o straně jsou na jednom místě:** `src/lib/strana.ts`. Název, počet
zastupitelů, datum voleb, e-mail, druhá kandidátka pro zkušební lístek.
Nic z toho se nikde jinde nepíše natvrdo.

**Jak volit** — přepsané z 27 křížků na 9. Zkušební lístek má obě skutečné
kandidátky včetně jmen, protože v Kníničkách kandidují jen dvě strany a
zástupná kandidátka by lístek zkreslila. Přibyla sekce „Kde a kdy se volí"
(Kníničky mají jediný okrsek, takže vyhledávač místnosti nemá co řešit).

**Logo** je nové a zástupné — `npm run logo`. Značka je kruh z linky se
zeleným břehem nad modrou hladinou, wordmark je Inter převedený na cesty.
Generátor si řezy Interu stáhne sám.

**Mapa** je Brno-Kníničky, výřez drží samotnou ves. Generátor umí i relace
(multipolygony) — bez toho v mapě chyběla Brněnská přehrada, protože je
v OpenStreetMap relace, ne cesta. Přibyly vrstvy krajiny (les, pole), bez
kterých byla víc než polovina výřezu prázdná tmavá plocha. Paleta je vybraná
z variant vykreslených vedle sebe: modrá teď znamená vodu a nic jiného,
zástavba je šedá, zeleň krajiny tlumená, aby si nekonkurovala s odznaky.
Výřez je utažený na samotnou ves. Na mapě je jeden zástupný bod.
Přegenerování: `npm run mapa`.

**Všechno projde:**

```
npm run build            # bez chyby i bez varování
npm run zkouska          # 30 kontrol, 2 čekají na skutečný obsah
npm run zkouska-bez-js   # 6 kontrol
```

Zkouška bez JavaScriptu je nová — „bez JS web funguje" byla zásada, kterou
dosud nic nehlídalo.

**Odpočet do voleb** se opravoval: mířil na konec voleb místo na začátek
a zaokrouhloval načatý den nahoru, takže místo 35 dnů svítilo 37 — a v pátek
odpoledne, kdy se už volilo, by hlásil „zbývá 1 den". Logika je teď
v `src/lib/odpocet.ts`, počítá kalendářní dny v pražské zóně a hlídají ji
čtyři kontroly ve zkoušce.

---

## Co zbývá

### Placeholdery, které musí pryč, než web půjde naostro

| Kde | Co |
|---|---|
| `src/lib/strana.ts` | `HESLO` — motto strany, teď `#Placeholder` |
| `src/lib/strana.ts` | `EMAIL` — teď zástupný `info@zakninicky.cz` |
| `src/content/program/*-placeholder.md` | celý program (4 zástupné oblasti) |
| `src/content/program-detail/placeholder*.md` | podrobný rozpis (2 zástupné — s jedním by odkazy na sousední oblast neměly kam vést) |
| `src/content/zamery/01-placeholder.md` | body na mapě |
| `src/pages/jak-volit.astro` | `MISTNOST` — adresa volební místnosti podle vyhlášky |
| `src/pages/transparentnost.astro` | kontaktní osoba, období, částka |
| `src/pages/soukromi.astro` | `ODPOVEDNA_OSOBA` |
| `src/pages/kontakt.astro` | odkazy na sociální sítě (prázdné = sekce se neukáže) |
| `astro.config.mjs` + `src/layouts/Zaklad.astro` | doména, teď zástupná `zakninicky.cz` |
| `src/assets/portrety/` | fotky kandidátů |
| úvodní stránka, `/lide/` | texty „kdo jsme" |

### Mapa — co by se ještě dalo doladit

Podklad je čitelný a geograficky správný. Zbývá jen kosmetika:

- **Hráz je až u dolního okraje.** Přehrada podle OpenStreetMap sahá
  na jih k 49.2278, tedy pod dolní hranu výřezu (49.2295) — hráz na jejím
  jižním konci je proto vidět jen zčásti. Kdyby na ní měl být bod, stačí
  posunout `jih` v `nastroje/mapa.mjs` na 49.2270.
- **Chatové osady na severním břehu** (kolem 49.2485–49.2584) jsou mimo
  výřez. Až bude potřeba bod i tam, sestavení na to samo upozorní.
- Podklad mapy váží 142 kB (asi 54 kB po zabalení). Je to cena za vrstvy
  krajiny a stojí to za to; kdyby se to mělo srazit, jde zvětšit krok
  v `proredit()` v `nastroje/mapa.mjs`.

### Dvě kontroly čekají na obsah

`npm run zkouska` je celá zelená, ale dvě věci hlásí žlutě `CEKA`, protože
na placeholderu nemají co měřit:

1. `podrobnost ma vic textu nez odrazky` — až bude skutečný program.
2. `filtr mapy neco skryl` — až budou body aspoň ve dvou oblastech.

Nejsou vypnuté schválně: kdyby se tiše přeskakovaly, nikdo by nepoznal,
že už se dají kontrolovat.

---

## Na co pozor

- **Dva kandidáti se jmenují stejně** — Pavel Jankůj, č. 1 (64 let) a č. 7
  (41 let). Není to překlep, oba jsou na listině. V medailonku je odliší
  jen věk a povolání. **Rozhodnout, jestli to takhle stačí**, nebo se má
  přidat něco dalšího.
- **Politická příslušnost** (ODS u č. 1 a 7, KDU-ČSL u č. 9) se vypisuje
  jen v medailonku, nikde jinde. Úplný název strany včetně ODS a KDU-ČSL
  je jen tam, kde ho žádá zákon: na zkušebním lístku, v oznámení
  o transparentnosti a jako správce údajů. **Rozhodnout, jestli i tohle
  není moc.**
- **Zelená `#5bae39` se nesmí použít na text** (kontrast 2,9 : 1). Od toho
  je `--zelena-text`. Platí to i v logu — „Za" je proto tmavší zelenou.
- **Draft běží v podsložce `/web-za-kninicky/`**, ne v kořeni. Odkazy vždy
  přes `odkaz()` z `src/lib/odkaz.ts`.
- **`astro preview` neumí dva běhy zároveň.** Když už jeden běží, druhý se
  nespustí a jen ohlásí port toho běžícího — klidně jiný, než jaký jste
  zadali. Zastavuje se `npx astro preview stop`.
- **`fontkit` je nová vývojová závislost** (jen pro generátor loga).
  Po `git pull` je potřeba `npm install`.
