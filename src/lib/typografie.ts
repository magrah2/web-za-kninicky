/**
 * České typografické úpravy, které se dělají až na hotovém HTML.
 *
 * Zatím jediné pravidlo: **jednopísmenné předložky a spojky nesmí zůstat
 * viset na konci řádku.** „nezávislí kandidáti s" a na dalším řádku
 * „podporou" je chyba, kterou čeština nepromíjí.
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
 */
const PREDLOZKY = /(?<=^|\s)([ksvzouaiKSVZOUAI])\s+/g;

/** Přilepí jednopísmenná slova k následujícímu slovu. Pracuje na čistém textu. */
export function prilepPredlozky(text: string): string {
  return text.replace(PREDLOZKY, '$1 ');
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
      return vNetknutem > 0 ? cast : prilepPredlozky(cast);
    })
    .join('');
}
