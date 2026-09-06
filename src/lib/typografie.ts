/**
 * České typografické úpravy, které se dělají až na hotovém HTML.
 *
 * Pravidlo: **předložky nesmí zůstat viset na konci řádku.** „nezávislí
 * kandidáti s" a na dalším řádku „podporou" je chyba, kterou čeština
 * nepromíjí. U jednopísmenných je to povinnost, u dvoupísmenných („cesta do"
 * / „spádové školy") zvyklost, na kterou je v úzkém sloupci vidět nejvíc.
 *
 * PROČ AŽ NA HTML, A NE V TEXTECH: nezlomitelná mezera je neviditelný znak.
 * Kdyby se psala rovnou do textů v Markdownu a v šablonách, nikdo by v editoru
 * nepoznal, kde je a kde chybí — a u každé nové věty by se na ni zapomnělo.
 * Takhle se to udělá jednou v `Zaklad.astro` a platí to pro celý web, včetně
 * textů, které do něj teprve někdo dopíše.
 *
 * Pevné zlomy řádků by to nevyřešily: web se čte na displejích od 320 px
 * po dva metry a zlom napsaný pro jednu šířku je na jiné špatně.
 */

/**
 * Značky, jejichž obsah se nesmí sahat.
 *
 * `script` a `style` nejsou text, ale kód — nezlomitelná mezera by ho
 * rozbila. `code` a `pre` zobrazují přesně to, co je v nich napsané,
 * takže do nich taky nepatří.
 */
const NETKNUTE = new Set(['script', 'style', 'code', 'pre', 'textarea']);

/**
 * Jednopísmenná slova, za kterými má být nezlomitelná mezera.
 *
 * Předložky k, s, v, z, o, u a spojky a, i. Velká písmena kvůli začátkům vět.
 *
 * Před předložkou smí stát začátek textu, mezera, otvírací závorka nebo
 * uvozovka. Kdyby tam směla být jen mezera, zůstalo by viset „(v" ve větě
 * „(v současnosti dočasné parkoviště)" — před tím „v" žádná mezera není.
 */
const PREDLOZKY = /(?<=^|[\s([„“"'])([ksvzouaiKSVZOUAI])\s+/g;

/**
 * Dvoupísmenné předložky.
 *
 * `se` v seznamu schválně není. Jako předložka je řídké („se školou"),
 * kdežto zvratné zájmeno „se" je v každé druhé větě — a to na konci řádku
 * viset může. Regulární výraz mezi nimi rozlišit neumí, takže je lepší
 * jednu předložku nechat být než tisíc zájmen přilepit špatně.
 *
 * Co smí stát před předložkou, je popsané u `PREDLOZKY` výš. Za ní musí být
 * mezera — proto se „do" uvnitř slova „dobrý" nechytí.
 */
const PREDLOZKY_DVE = /(?<=^|[\s([„“"'])([dD]o|[nN]a|[pP]o|[zZ]a|[oO]d|[oO]b|[kK]e|[kK]u|[vV]e|[zZ]e)\s+/g;

/**
 * Třípísmenné předložky.
 *
 * Ty už na konci řádku viset smí, ale v úzkém sloupci to bije do očí stejně
 * jako u kratších — „spolupracovat při" a na dalším řádku „přípravě" se čte
 * hůř. Delší předložky (před, přes, kolem) se schválně nelepí: čtyři a víc
 * písmen na konci řádku už nikoho neruší a každé další slovo v seznamu je
 * další místo, kde se řádek zalomí dřív, než by musel.
 *
 * Všechna ta slova jsou jen předložky, nic jiného v češtině neznamenají,
 * takže tu nehrozí to, co u „se" — viz `PREDLOZKY_DVE`.
 */
const PREDLOZKY_TRI = /(?<=^|[\s([„“"'])([bB]ez|[pP]ro|[pP]ři|[nN]ad|[pP]od|[dD]le|[kK]ol)\s+/g;

/**
 * Přilepí předložky k následujícímu slovu. Pracuje na čistém textu.
 *
 * Pořadí je podstatné jen v jednom směru: dvoupísmenný výraz najde shodu
 * i za nezlomitelnou mezerou, kterou nechal ten první, protože `\s`
 * v JavaScriptu U+00A0 zahrnuje.
 */
export function prilepPredlozky(text: string): string {
  return text
    .replace(PREDLOZKY, '$1 ')
    .replace(PREDLOZKY_DVE, '$1 ')
    .replace(PREDLOZKY_TRI, '$1 ');
}

/**
 * Slova jako „U-rampa" nebo „e-mail" — jedno písmeno, spojovník, zbytek slova.
 *
 * Prohlížeč po spojovníku řádek zalomit smí a u takového slova to dopadne
 * špatně: na konci řádku zůstane osamocené „U-" a zbytek spadne níž.
 *
 * Řeší se to obalem s `white-space: nowrap`, ne pevným spojovníkem U+2011:
 * ten v našem řezu Montserratu **není** (ověřeno fontkitem, vrací .notdef),
 * takže by ho prohlížeč vysadil náhradním písmem a jeden spojovník na
 * stránce by byl viditelně jiný než ostatní.
 *
 * Jedno písmeno před spojovníkem je schválně: „Brno-Kníničky" ani „KDU-ČSL"
 * se dělit smí a taky se to na úzkém displeji hodí.
 */
const KRATKE_SPOJENI = /(?<=^|[\s([„“"'])(\p{L}-\p{L}+)(?![\p{L}-])/gu;

/** Obalí taková slova. Jen pro HTML — do čistého textu značka nepatří. */
function neomezitDeleni(text: string): string {
  return text.replace(KRATKE_SPOJENI, '<span class="nedelit">$1</span>');
}

/**
 * Projde HTML a upraví jen text mezi značkami — ne samotné značky ani jejich
 * atributy. Kdyby se pravidlo pustilo na celý řetězec, přepsalo by i adresy
 * v `href` a názvy tříd.
 */
export function upravTypografii(html: string): string {
  // Rozdělí řetězec na značky (`<...>`) a text mezi nimi. Liché prvky pole
  // jsou značky, sudé text — `split` se zachytávající skupinou to tak vrací.
  const casti = html.split(/(<[^>]*>)/);

  let vNetknutem = 0;

  return casti
    .map((cast) => {
      if (cast.startsWith('<')) {
        const shoda = /^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)/.exec(cast);
        if (shoda && NETKNUTE.has(shoda[2].toLowerCase())) {
          if (shoda[1] === '/') vNetknutem = Math.max(0, vNetknutem - 1);
          else if (!cast.endsWith('/>')) vNetknutem++;
        }
        return cast;
      }
      return vNetknutem > 0 ? cast : neomezitDeleni(prilepPredlozky(cast));
    })
    .join('');
}
