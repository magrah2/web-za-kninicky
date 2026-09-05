/**
 * Programové oblasti — jediný seznam, ze kterého čerpá všechno ostatní:
 * schéma programu a záměrů, filtry a štítky u bodů na mapě.
 *
 * Když se sem něco přidá, objeví se to všude. Když se u záměru nebo
 * programové oblasti napíše téma, které tady není, Astro shodí sestavení
 * a chyba se nedostane na web.
 */

export const TEMATA = [
  'Komunikace',
  'Hospodaření',
  'Bydlení',
  'Zeleň a voda',
  'Doprava',
  'Školství',
  'Sport',
  'Kultura',
  'Podnikání',
  'Bezpečnost',
] as const;

export type Tema = (typeof TEMATA)[number];

/** Barva, kterou se téma značí na mapě a ve štítcích. Odstíny modré a zelené
    z loga — nic mimo značkovou paletu, jinak se web rozsype do duhy. */
export const BARVA_TEMATU: Record<Tema, string> = {
  // Hlavní barva webu (`--sedozelena`). Komunikace je první oblast programu
  // a jediná, která nemluví o konkrétním místě, ale o tom, jak se rozhoduje —
  // proto nese barvu webu, ne jeden z jeho akcentů.
  'Komunikace': '#517359',
  'Hospodaření': '#1d6eb0',
  'Bydlení': '#2b8ac9',
  'Zeleň a voda': '#5bae39',
  'Doprava': '#0e4d80',
  'Školství': '#3f9bd4',
  // Tmavší zelená (`--zelena-text`). Sport sousedí na stránce se Školstvím
  // a Dopravou, tedy se dvěma modrými — zelená je od nich odliší i tomu,
  // kdo modré odstíny rozlišuje hůř.
  'Sport': '#3d7a24',
  'Kultura': '#7cc45f',
  'Podnikání': '#145286',
  'Bezpečnost': '#4a9e7e',
};

/** Adresní tvar tématu pro filtrování přes URL: „Zeleň a voda" → „zelen-a-voda" */
export function temaDoAdresy(tema: string): string {
  return tema
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Politická příslušnost — uvádí se na kandidátní listině, takže ji
    ukazujeme dobrovolně i na webu. Kdo je bez příslušnosti, nemá pole
    `prislusnost` vyplněné a na medailonku se u něj nic nevypisuje;
    psát „bez politické příslušnosti" k šesti z devíti lidí by z výjimky
    udělalo hluk. */
export const PRISLUSNOSTI = ['ODS', 'KDU-ČSL'] as const;
