/**
 * Text odpočtu do voleb.
 *
 * Bydlí to ve vlastním souboru, protože se to počítá **dvakrát**: jednou při
 * sestavení (aby stránka měla správný text i bez JavaScriptu) a pak ještě
 * v prohlížeči, aby číslo nezestárlo mezi nasazeními. Kdyby ta logika byla
 * opsaná na dvou místech, jedno z nich by se dřív nebo později rozešlo —
 * a nejspíš to, které se ukáže jen návštěvníkovi bez skriptu.
 *
 * Volby jsou dvoudenní a to je na tom celé podstatné. Odpočet míří na to,
 * kdy se místnosti **otevřou**, ne kdy se zavřou; mezi tím se nesmí ukazovat
 * „zbývá 1 den", protože v tu chvíli už se dávno volí.
 */

/**
 * Kalendářní den v Praze jako číslo, aby se dva okamžiky daly odečíst.
 *
 * Počítá se přes kalendářní dny, ne přes hodiny — „zbývá 5 dní" má znamenat
 * pět přespání, ne 120 hodin. Na rozdílu hodin se to pletlo: v pátek o půl
 * druhé, půl hodiny před otevřením místností, vycházel rozdíl na necelý den
 * a odpočet z toho udělal „volby jsou zítra".
 *
 * Zóna je natvrdo Praha, ne zóna prohlížeče. Volby jsou v Kníničkách
 * a datum se má počítat podle nich i tomu, kdo se na web dívá z Kanady.
 */
const PRAZSKY_DEN = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Prague',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function den(cas: Date): number {
  const [rok, mesic, denVMesici] = PRAZSKY_DEN.format(cas).split('-').map(Number);
  return Date.UTC(rok, mesic - 1, denVMesici) / 86_400_000;
}

export type StavVoleb = { text: string; probihaji: boolean };

/**
 * @param zacatek kdy se otevřou volební místnosti (pátek 14:00)
 * @param konec   kdy se zavřou (sobota 14:00)
 * @param ted     pro zkoušení se dá podstrčit jiný čas
 */
export function odpocet(
  zacatek: string | Date,
  konec: string | Date,
  ted: Date = new Date(),
): StavVoleb {
  const od = new Date(zacatek);
  const doKdy = new Date(konec);

  if (ted.getTime() >= doKdy.getTime()) return { text: 'po volbách', probihaji: false };
  if (ted.getTime() >= od.getTime()) return { text: 'volby probíhají', probihaji: true };

  const dnu = den(od) - den(ted);

  if (dnu <= 0) return { text: 'volby jsou dnes', probihaji: false };
  if (dnu === 1) return { text: 'volby jsou zítra', probihaji: false };
  // Čeština skloňuje: 2–4 dny, 5+ dní. Jednička sem nedojde — tu řeší
  // řádek nad tím.
  const tvar = dnu >= 5 ? 'dní' : 'dny';
  return { text: `zbývá ${dnu} ${tvar}`, probihaji: false };
}
