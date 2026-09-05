/**
 * Údaje o volební straně a o volbách — jediné místo, kde jsou zapsané.
 *
 * Web vznikl přeskládáním šablony z jiné obce a při tom se ukázalo, proč
 * tenhle soubor musí existovat: název strany, počet zastupitelů a e-mail
 * byly rozepsané po dvaceti souborech a při přenosu z nich část tiše
 * zůstala. Cokoliv, co by se při použití v další obci muselo přepsat,
 * patří sem — ne do textu stránky.
 *
 * Do textů se dosazuje odsud. Když je někde potřeba tvar, který se odsud
 * poskládat nedá (skloňování, sazba na dva řádky), napíše se natvrdo,
 * ale s komentářem proč.
 */

/**
 * Krátký název, kterým se strana označuje na webu.
 *
 * Úplný registrovaný název (`NAZEV_UPLNY`) je dlouhý a nese jména dvou
 * politických stran; v běžném textu by přebil všechno ostatní. Používá se
 * proto jen na čtyřech místech — na hlasovacím lístku, v oznámení
 * o transparentnosti, jako správce údajů a na úvodní stránce pod údaji
 * o volbách.
 */
export const NAZEV = 'Za Kníničky';

/** Úplný název tak, jak je zapsaný na kandidátní listině. */
export const NAZEV_UPLNY = 'Za Kníničky nezávislí kandidáti s podporou ODS a KDU-ČSL';

/** Vylosované číslo na hlasovacím lístku. */
export const CISLO_STRANY = 1;

/**
 * Motto. Stojí jako claim na úvodní stránce, v patičce a v titulku okna.
 *
 * Tečka na konci je schválně: je to věta, ne hashtag.
 *
 * Je rozepsané na dvě části, protože hero je sází každou jinak velkou —
 * „Povídejte," nahoře velké, „my nasloucháme." pod tím menší. Kdyby se
 * ten rozpad napsal natvrdo v `index.astro`, byl by to druhý zdroj pravdy
 * a při změně hesla by se rozešel s patičkou i titulkem okna. Celý tvar
 * se proto skládá odsud a nikde jinde se nepíše.
 */
export const HESLO_ZACATEK = 'Povídejte,';
export const HESLO_KONEC = 'my nasloucháme.';
export const HESLO = `${HESLO_ZACATEK} ${HESLO_KONEC}`;

/** Obec, respektive městská část, do jejíhož zastupitelstva se kandiduje. */
export const OBEC = 'Brno-Kníničky';

/** Tvar do věty: „…, co vás v Kníničkách štve". */
export const OBEC_V = 'v Kníničkách';

/** Tvar do věty: „…lidí z Kníniček". */
export const OBEC_Z = 'z Kníniček';

/** Název zastupitelstva do věty: „Volby do zastupitelstva…". */
export const ZASTUPITELSTVO = 'zastupitelstva městské části Brno-Kníničky';

/**
 * Kolik se volí zastupitelů — a tedy kolik má volič křížků.
 *
 * Devět. Řídí počet políček na zkušebním hlasovacím lístku i všechna čísla
 * ve výkladu na `/jak-volit/`, takže se nikde jinde nesmí psát natvrdo.
 * Obě kandidátní listiny v Kníničkách mají přesně devět jmen, což tenhle
 * počet potvrzuje: víc kandidátů, než se volí zastupitelů, listina mít nesmí.
 */
export const POCET_ZASTUPITELU = 9;

/** Číslovka slovy, prvním pádem — do nadpisů, kde by číslice byla suchá. */
export const POCET_SLOVY = 'devět';

/** E-mail, na který se lidem odpovídá. */
export const EMAIL = 'zakninicky@gmail.com';

/**
 * Kdo odpovídá za zpracování osobních údajů — jméno na `/soukromi/`.
 *
 * Bez jména by stránka svou povinnost podle GDPR neplnila. Patří sem, a ne
 * do `soukromi.astro`, ze stejného důvodu jako všechno ostatní v tomhle
 * souboru: v jiné obci to bude někdo jiný a nemá se to hledat po stránkách.
 *
 * Bez titulů schválně. Na kandidátce je „Ing. arch. Barbora Jelínková, Ph.D.",
 * ale tohle je kontaktní údaj, ne medailonek.
 */
export const ODPOVEDNA_OSOBA = 'Barbora Jelínková';

/**
 * Kdy se otevřou a kdy zavřou volební místnosti.
 *
 * Dvě hodnoty, ne jedna, a je to schválně: volby jsou dvoudenní. Odpočet na
 * úvodní stránce míří na `ZACATEK_VOLEB`, protože otázka je „kdy můžu jít
 * volit"; mezi začátkem a koncem se pak ukazuje „volby probíhají". Kdyby tu
 * byl jen jeden čas, jeden ze dvou volebních dnů by se odpočtu nevešel.
 */
export const ZACATEK_VOLEB = '2026-10-09T14:00:00+02:00';
export const KONEC_VOLEB = '2026-10-10T14:00:00+02:00';

/** Datum voleb pro sazbu do textu. */
export const DATUM_VOLEB = '9.–10. října 2026';

/** Hodiny, kdy jsou volební místnosti otevřené. */
export const HODINY_VOLEB = { patek: '14:00–22:00', sobota: '8:00–14:00' };

/**
 * Ostatní kandidátky v obci — pro zkušební hlasovací lístek.
 *
 * V šabloně tu byly zástupné „Ukázkové kandidátky A a B" s odůvodněním, že
 * jmenovat konkurenci by vypadalo jako útok. V Kníničkách kandidují jen dvě
 * strany, takže zástupná kandidátka by lístek naopak zkreslila — volič by
 * na zkoušku dostal jiný lístek, než jaký pak najde v obálce. Jména jsou
 * navíc z úřední kandidátní listiny, která je ze zákona veřejná, a lístek
 * je nekomentuje: vypisuje je přesně tak, jak budou ve volební místnosti.
 */
export const OSTATNI_KANDIDATKY = [
  {
    id: 'spolecne-pro-kninicky',
    cislo: 2,
    nazev: 'Společně pro Kníničky',
    jmena: [
      'Lenka Ištvanová',
      'Miroslava Keprtová',
      'Václav Hrnčíř',
      'Aleš Chrastil',
      'Michal Popovič',
      'Petra Švehlová',
      'Jaroslav Zounek',
      'Jana Tesařová',
      'Miroslav Machovec',
    ],
  },
];
