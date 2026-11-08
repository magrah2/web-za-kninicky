---
# Šablona nové aktuality. Soubory začínající podtržítkem web přeskakuje,
# takže tenhle vzor může ležet rovnou vedle skutečných zpráv.
#
# JAK PŘIDAT AKTUALITU
# 1. Zkopírujte tenhle soubor pod novým názvem ve tvaru
#    RRRR-MM-DD-kratky-popis.md (třeba 2026-11-20-uzavirka-ondrovy.md).
#    Název souboru se nikde nevypisuje, slouží jen k orientaci v seznamu.
# 2. Vyplňte hlavičku níž a pod čáru napište text zprávy.
# 3. Až text někdo z týmu potvrdí, přepište `stav: navrh` na `overeno`.

# Nadpis zprávy.
titulek: "Sem napište nadpis."

# Datum zprávy ve tvaru RRRR-MM-DD. Vypisuje se u ní a řadí se podle něj.
datum: 2026-11-08

# navrh = rozepsané, na web se to NEDOSTANE
# overeno = potvrzeno, zpráva se objeví na webu
stav: navrh

# Dokumenty ke stažení pod zprávou. Soubor nahrajte do public/dokumenty/
# (název bez mezer a háčků) a sem napište jen jeho název — velikost a typ si
# web dopočítá sám. Když příloha není, nechte řádek `prilohy:` prázdný.
prilohy:
  # - nazev: "Priority volebního programu"
  #   soubor: priority-volebniho-programu.pdf
---

Sem přijde text zprávy. Klidně na několik odstavců.

Můžete použít i odrážky:

- první věc
- druhá věc

Odkazy se píšou takhle: [úřad městské části](https://kninicky.brno.cz).
