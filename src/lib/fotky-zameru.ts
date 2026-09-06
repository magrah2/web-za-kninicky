/**
 * Fotky k bodům v mapě.
 *
 * Stejný princip jako u portrétů kandidátů (`portrety.ts`): fotka se nikam
 * nevypisuje, jen se do `src/assets/zamery/` uloží soubor pojmenovaný podle
 * záměru — `01-pristup-k-rece.md` → `01-pristup-k-rece.jpg`. Kdyby se cesta
 * psala do frontmatteru, byl by to další údaj, který se dá napsat špatně,
 * a nikdo kromě programátora by fotku nepřidal.
 *
 * Bod bez fotky se vykreslí bez ní. Většina bodů žádnou mít nebude —
 * fotka místa, které teprve má vzniknout, neexistuje.
 */

const soubory = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/zamery/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

const podleId = new Map<string, ImageMetadata>();

for (const [cesta, modul] of Object.entries(soubory)) {
  const shoda = cesta.match(/\/zamery\/([^/]+)\.[^./]+$/);
  if (!shoda) continue;
  podleId.set(shoda[1], modul.default);
}

export function fotkaZameru(id: string): ImageMetadata | undefined {
  return podleId.get(id);
}
