# QR kódy na tiskoviny Za Kníničky. Vzniká černá i bílá varianta bez pozadí
# a bez znaku uprostřed; podklad si doplní sazba tiskoviny.
#
#     julia QR_gen.jl                  # černá i bílá varianta
#     julia QR_gen.jl cerny             # jen černá
#     julia QR_gen.jl bily              # jen bílá
#
# Soubory se vždy jmenují podle varianty, například QR_web_cerny.svg.

using QRCoders

# Titulní strana je velkými písmeny schválně: doména je case-insensitive a
# velká písmena pustí kód do alfanumerického režimu, tedy o verzi menší kód.
# U programu to NEJDE — /PROGRAM/ je cesta na Linuxu a vrátila by 404.
const CILE = [
    ("QR_web",     "HTTPS://ZAKNINICKY.CZ"),
    ("QR_program", "https://zakninicky.cz/program/"),
]

# Bez znaku stačí Quartile (25 %, běžný standard pro tisk). Kód je díky tomu
# méně hustý a moduly jsou větší a lépe čitelné.
const VARIANTY = [
    "cerny" => (barvy = ("#000000", "#000000"), znak = false, korekce = Quartile()),
    "bily"  => (barvy = ("#ffffff", "#ffffff"), znak = false, korekce = Quartile()),
]

const OKRAJ = 4           # klidová zóna; 4 moduly jsou minimum normy
const PODIL = 0.20        # šířka favikony vůči šířce kódu
const PX = 1200           # cílová šířka PNG
# Favicon je malá samostatná značka ve stejných barvách jako web. Je vhodnější
# než široký wordmark a generuje se spolu s ním skriptem nastroje/logo.mjs.
const ZNAK = joinpath(@__DIR__, "..", "public", "favicon.svg")

# Vodorovné běhy se slepí do jednoho tahu, jinak mezi sousedními <rect>
# prosvítají vlasové čáry.
function tahy(maska)
    kusy = String[]
    for r in axes(maska, 1)
        c = 1
        while c <= size(maska, 2)
            if maska[r, c]
                z = c
                while c <= size(maska, 2) && maska[r, c]; c += 1; end
                push!(kusy, "M$(z-1) $(r-1)h$(c-z)v1h-$(c-z)z")
            else
                c += 1
            end
        end
    end
    join(kusy)
end

# Znak se čte z repozitáře, aby změna značky prošla i do kódů. Třídy z <style>
# se přepíšou na fill — vnořený <style> by platil pro celý dokument.
function nacti_znak()
    text = read(ZNAK, String)
    vb = match(r"viewBox=\"([^\"]+)\"", text).captures[1]
    telo = match(r"<svg[^>]*>(.*)</svg>"s, text).captures[1]
    for m in eachmatch(r"\.([\w-]+)\s*\{[^}]*?fill:\s*([^;}\s]+)"s, text)
        telo = replace(telo, "class=\"$(m.captures[1])\"" => "fill=\"$(m.captures[2])\"")
    end
    # Favicon ma dve barvy wordmarku. V QR kodu musi byt i on jednobarevny,
    # aby cela tiskovina drzela jeden tmave zeleny ton.
    telo = replace(telo, r"\sfill=\"[^\"]+\"" => " fill=\"$BARVA_QR\"")
    rozm = parse.(Float64, split(vb))
    (vb = vb, pomer = rozm[3] / rozm[4],
     telo = strip(replace(telo, r"<defs>.*?</defs>"s => "")))
end

function sestav(matice, zn, varianta)
    n = size(matice, 1)
    kod = n - 2 * OKRAJ
    px = max(1, cld(PX, n)) * n   # celé pixely na modul, jinak se hrany rozmažou

    viditelne, okno = matice, ""
    if varianta.znak
        # Okno se zaokrouhlí na nepárový počet modulů (`| 1`), aby jeho hrana
        # ležela na mřížce a sedělo na střed kódu. Rohy ostré.
        vs = ceil(Int, PODIL * kod + 1) | 1
        vv = ceil(Int, PODIL * kod / zn.pomer + 1) | 1
        x, y = (n - vs) ÷ 2, (n - vv) ÷ 2

        # Moduly pod znakem se NEKRESLÍ, místo aby se překryly bílým
        # obdélníkem. Překrytí dělalo v prohlížeči tmavý obrys kolem znaku:
        # moduly mají `crispEdges` a drží se pixelů, bílý obdélník se
        # antialiasuje, a tak zpod něj po zlomku pixelu vykoukly.
        viditelne = matice .& [!(x < c <= x + vs && y < r <= y + vv) for r in 1:n, c in 1:n]
        okno = """<svg x="$(x+0.5)" y="$(y+0.5)" width="$(vs-1)" height="$(vv-1)" """ *
               """viewBox="$(zn.vb)" preserveAspectRatio="xMidYMid meet">$(zn.telo)</svg>"""
    end

    inkoust, sedozelena = varianta.barvy
    # Rozhoduje střed modulu: (c-0,5)+(r-0,5) <= n, tedy c+r <= n+1.
    horni = [c + r <= n + 1 for r in 1:n, c in 1:n]
    cesty = inkoust == sedozelena ? [(inkoust, viditelne)] :
            [(inkoust, viditelne .& horni), (sedozelena, viditelne .& .!horni)]

    join(filter(!isempty, [
        """<svg xmlns="http://www.w3.org/2000/svg" width="$px" height="$px" viewBox="0 0 $n $n">""",
        ("""<path fill="$b" shape-rendering="crispEdges" d="$(tahy(m))"/>""" for (b, m) in cesty)...,
        okno,
        "</svg>",
    ]), "\n")
end

nazvy = first.(VARIANTY)
vybrane = isempty(ARGS) || "vse" in ARGS ? nazvy : ARGS
for jm in vybrane
    jm in nazvy || error("Neznama varianta: $jm. K dispozici: " * join(nazvy, ", ") * ", vse")
end

# Varianty jsou bez znaku; soubor favicon.svg se proto do generovani nectе.
zn = nothing
soubory = String[]
for (jmeno, adresa) in CILE, nazev in vybrane
    varianta = VARIANTY[findfirst(==(nazev), nazvy)].second
    matice = qrcode(adresa; eclevel = varianta.korekce, width = OKRAJ)
    cesta = joinpath(@__DIR__, "$(jmeno)_$(nazev).svg")
    write(cesta, sestav(matice, zn, varianta))
    push!(soubory, cesta)
    println(rpad(basename(cesta), 26), "verze ", (size(matice, 1) - 2 * OKRAJ - 17) ÷ 4,
            ", ", size(matice, 1), " modulu, korekce ", varianta.korekce)
end

println("\nRasterizuji do PNG...")
try
    run(`node $(joinpath(@__DIR__, "QR_do_png.mjs")) $soubory`)
catch e
    println("PNG se nepodarilo vyrobit: ", e, "\nSVG jsou hotova.")
end
