---
# ŠABLONA PRO NOVOU PROGRAMOVOU OBLAST
#
# Jak přidat oblast:
#   1. Zkopírujte tenhle soubor a pojmenujte kopii `<číslo>-<nazev>.md`,
#      třeba `3-doprava.md`. Číslo v názvu je jen pro pořádek ve složce,
#      pořadí na webu určuje `poradi:` níž.
#   2. Vyplňte řádky a pod čárou napište odrážky.
#   3. Hotovo.
#
# Soubory začínající podtržítkem se přeskakují, takže tahle šablona
# na web nikdy nejde.

# Pořadí na úvodní stránce i na /program/.
poradi: 1

# Krátký název na dlaždici na úvodní stránce — musí se vejít na řádek.
nazev: "Název oblasti"

# Plný nadpis na stránce programu. Bývá delší než název dlaždice.
# Když se nevyplní, použije se `nazev`.
nadpis: "Delší nadpis, který řekne, o co jde"

# Jedna věta na dlaždici. Ne odstavec — dlaždice je malá.
shrnuti: "Jedna věta, která shrne, o čem oblast je."

# Programová oblast. Určuje barvu a ikonu.
# Musí to být přesně jedna z hodnot v src/lib/temata.ts:
#   Hospodaření · Bydlení · Zeleň a voda · Doprava
#   Školství · Kultura · Podnikání · Bezpečnost
# Překlep shodí sestavení, takže si toho všimneme my, ne návštěvník.
tema: Hospodaření
---

- Sem patří odrážky. Každá je jedna konkrétní věc, kterou chceme udělat.
- Co v odrážkách není, to se za program vydávat nemá.
