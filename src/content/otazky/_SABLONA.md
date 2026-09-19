---
# Šablona nové otázky. Soubory začínající podtržítkem web přeskakuje,
# takže tenhle vzor může ležet rovnou vedle skutečných dotazů.
#
# JAK PŘIDAT OTÁZKU
# 1. Zkopírujte tenhle soubor pod novým názvem ve tvaru
#    RRRR-MM-DD-kratky-popis.md (třeba 2026-09-17-parkovani-u-skoly.md).
#    Název souboru se nikde nevypisuje, slouží jen k orazení v seznamu.
# 2. Vyplňte hlavičku níž a pod čáru napište odpověď.
# 3. Až odpověď někdo z týmu potvrdí, přepište `stav: navrh` na `overeno`.

# Otázka tak, jak padla. Zkrátit se dá, smysl měnit ne.
otazka: "Sem napište otázku."

# Kdy otázka zazněla nebo přišla. Ve tvaru RRRR-MM-DD.
datum: 2026-09-17

# Pořadí mezi otázkami ze stejného dne — nepovinné, menší číslo je výš.
# Nechte prázdné, pokud na pořadí nezáleží.
poradi:

# Ukázat tuhle otázku na úvodní stránce? Místo je tam na dvě.
na_uvod: false

# Odkud dotaz je: debata = volební debata, mail = e-mail od občana.
puvod: debata

# Programová oblast, které se dotaz týká — nepovinné.
# Možnosti: Komunikace, Veřejná vybavenost, Sport a rekreace, Doprava, Bydlení
tema:

# navrh = rozepsané, na web se to NEDOSTANE
# overeno = potvrzeno, otázka se objeví na webu
stav: navrh

# Dokumenty ke stažení. Soubor nahrajte do public/dokumenty/ a sem napište
# jen jeho název — velikost a typ si web dopočítá sám. Když příloha není,
# nechte řádek `prilohy:` prázdný nebo ho smažte.
prilohy:
  # - nazev: "Projektová dokumentace — Ondrova"
  #   soubor: ondrova-dokumentace.pdf
  #   popis: "Situační výkres a technická zpráva, prosinec 2025."
---

Sem přijde odpověď. Klidně na několik odstavců.

Můžete použít i odrážky:

- první věc
- druhá věc

Odkazy se píšou takhle: [úřad městské části](https://kninicky.brno.cz).
