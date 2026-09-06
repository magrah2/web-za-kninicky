import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { TEMATA } from './lib/temata';

/**
 * Schéma dat. Tohle je pojistka, ne byrokracie: když někdo v souboru
 * kandidáta napíše téma s překlepem nebo zapomene pořadí, shodí to
 * sestavení webu — chyba se ukáže mně, ne návštěvníkovi.
 *
 * Soubory začínající podtržítkem (`_SABLONA.md`) se přeskakují,
 * takže vzor pro vyplňování může ležet rovnou vedle skutečných dat.
 *
 * Nevyplněná pole jsou `nullish`, ne `optional` — a je to schválně.
 * `foto:` bez hodnoty je v YAML `null`, ne chybějící klíč, a `optional()`
 * by null odmítl. Kdyby tu bylo `optional()`, každý nevyplněný řádek
 * v šabloně by shodil sestavení.
 */

const kandidati = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!_*.md'], base: './src/content/kandidati' }),
  schema: z.object({
    poradi: z.number().int().min(1),
    jmeno: z.string(),
    vek: z.number().int().optional(),
    povolani: z.string(),
    prislusnost: z.string().optional(),
    /**
     * Rodné příjmení, bez slova „roz.". Vypisuje se jen tam, kde má pomoct
     * poznat člověka podle jména z dřívějška — dnes na inzerci ve zpravodaji.
     *
     * Je to samostatné pole, ne součást `jmeno`, schválně: `jmeno` se
     * vypisuje i na zkušebním hlasovacím lístku a ten má ukazovat přesně to,
     * co volič najde v obálce. Kdyby se rodné příjmení přidalo do `jmeno`,
     * změnilo by se i tam.
     */
    rozena: z.string().nullish(),
    /** Jedna věta, která se na medailonku vytáhne velkým písmem. */
    citace: z.string().nullish(),
    /** Zapojení mimo práci — spolky, sdružení. */
    pusobeni: z.string().nullish(),
  }),
});

const program = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!_*.md'], base: './src/content/program' }),
  schema: z.object({
    poradi: z.number().int(),
    /** Krátký název na dlaždici na úvodní stránce — musí se vejít na řádek. */
    nazev: z.string(),
    /** Plný nadpis oblasti tak, jak je na stránce programu. */
    nadpis: z.string().nullish(),
    /** Jedna věta na dlaždici na úvodní stránce. */
    shrnuti: z.string(),
    tema: z.enum(TEMATA),
  }),
});

/**
 * Body na mapě záměrů. Jeden soubor = jedno místo.
 *
 * Číslo na odznaku se **nikde nevypisuje** — dopočítá si ho mapa z pořadí
 * souborů. Dřív tu bylo pole `poradi` a při každém přidání nebo odebrání
 * bodu se musely přepsat všechny ostatní, jinak v řadě zůstala mezera.
 * Pořadí teď určuje název souboru, takže se nový bod přidá jedním souborem
 * a nic dalšího se nemusí hlídat.
 */
const zamery = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!_*.md'], base: './src/content/zamery' }),
  schema: z.object({
    nazev: z.string(),
    /**
     * Programová oblast, nebo víc oblastí naráz.
     *
     * Na rozdíl od programu, kde má každá oblast právě jedno téma, jedno
     * místo na mapě může patřit do dvou i tří — parkoviště je zároveň
     * dopravní stavba i veřejná vybavenost. Píše se buď `tema: Doprava`,
     * nebo `tema: [Doprava, Veřejná vybavenost]`.
     *
     * PRVNÍ v seznamu určuje BARVU odznaku: víc barev jeden puntík neunese.
     * Pod filtrem se bod ukáže u všech svých oblastí.
     */
    tema: z.union([z.enum(TEMATA), z.array(z.enum(TEMATA)).nonempty()]),
    /**
     * Zeměpisné souřadnice místa. Web si z nich polohu na mapě dopočítá sám
     * (src/lib/mapa.ts), takže když se změní výřez mapy, body se posunou
     * s ním. Zjistí se nejsnáz na mapy.cz — pravý klik na místo.
     */
    lat: z.number().min(48).max(51),
    lon: z.number().min(12).max(19),
    /**
     * `navrh` = bod, u kterého text zatím nikdo z týmu nepotvrdil.
     * Vykreslí se s viditelnou značkou, aby si ho nikdo nespletl se závazkem.
     * Jakmile text potvrdíte, přepište na `overeno` a značka zmizí.
     */
    stav: z.enum(['navrh', 'overeno']).default('navrh'),
    /**
     * Popisek fotky. Samotná fotka se sem nepíše — stačí ji uložit do
     * `src/assets/zamery/` pod stejným názvem, jaký má tenhle soubor
     * (viz `src/lib/fotky-zameru.ts`).
     *
     * Popisek je POVINNÝ všude, kde fotka je, a sestavení to hlídá
     * (MapaZameru.astro). Jsou pro to dva důvody a oba jsou vážné:
     *
     *  – Fotka bez popisku je pro čtečku obrazovky prázdné místo.
     *  – Na volebním webu se fotka vedle slibu čte jako „takhle to tady
     *    vypadá" nebo „tohle jsme postavili". U ilustrační fotky odjinud
     *    to musí být napsané, ne domyšlené.
     *
     * Patří sem i zdroj a licence, pokud fotka není naše.
     */
    foto_popis: z.string().nullish(),
  }),
});

export const collections = { kandidati, program, zamery };
