# Finanz-demo – Design

Referenz für die Umsetzung der Oberfläche. Die Screens in `screens/` sind Design-Entwürfe aus einem Design-Canvas (Format `.dc.html`): normales HTML mit Inline-Styles, die Logik steht im `<script type="text/x-dc">`-Block. Sie laufen nicht eigenständig, sondern dienen als Vorlage für Layout, Abstände, Texte und Interaktionen. Alle Beträge und Anbieter darin sind Beispieldaten.

## Screens

| Datei | Gerät | Inhalt |
|---|---|---|
| `Main.dc.html` | Smartphone 390×844 | Übersicht: Gesamtvermögen mit Verlauf, Monat (Einnahmen/Ausgaben/übrig, noch geplant), Ausgaben nach Kategorie, Sparhinweis |
| `Ziele.dc.html` | Smartphone | Sparziele mit Fortschritt und Monatsrate, Tabs „Aktiv/Erreicht“, Notgroschen-Check |
| `Vertraege.dc.html` | Smartphone | Fixkosten, Sparpotenzial, bald kündbare Verträge mit Kündigen-Aktion, Vertragswecker |
| `Anlage.dc.html` | Smartphone | Depotwert, Sparplan-Rechner (Rate × Laufzeit, 6 % p. a. Annahme), Freistellungsaufträge, Altersvorsorgedepot |
| `Desktop.dc.html` | Desktop ≥ 1280 px, fluid | Seitenleiste + Inhaltsbereich mit allen vier Bereichen |
| `Tablet.dc.html` | Tablet 834 px | bindet `Desktop.dc.html` in schmaler Breite ein (gleiches Layout, Karten brechen um) |

Responsives Verhalten: Smartphone = Bottom-Navigation mit 4 Tabs; ab Tablet = Seitenleiste links (`flex: 1 1 232px`), Inhalt rechts (`flex: 999 1 560px`), Kartenraster mit `repeat(auto-fit, minmax(…))`, breite Tabellen scrollen horizontal.

Im Design steht noch der Platzhalter `[App-Name]` – in der App ist das **Finanz-demo**.

## Navigation

1. Übersicht · 2. Ziele · 3. Verträge · 4. Anlage

## Farben

Akzentfarben kommen aus den bestehenden CSS-Variablen in `src/styles.css`; das dunkle Grün-Schwarz ist bewusst gesetzt und bleibt.

| Token | Wert | Verwendung |
|---|---|---|
| `--color-primary` | `#0f766e` | Akzent: aktive Navigation, Fortschrittsbalken, Diagrammlinie, Links |
| `--color-primary-hover` | `#115e59` | Hover, Text auf hellem Akzent-Hintergrund |
| `--color-background` | `#f8fafc` | Seitenhintergrund |
| Ink | `#12201a` | Haupttext, dunkle Karten (Vermögen, Sparplan-Rechner), Seitenleiste |
| Muted | `#475569` | Sekundärtext, inaktive Navigation |
| Surface | `#ffffff` | Karten |
| Border | `#e2e8f0` | Kartenrahmen, Balken-Hintergrund |
| Divider | `#f1f5f9` | Trennlinien in Listen |
| Accent on dark | `#5eead4` | Zahlen, Linien und aktive Buttons auf dunklem Grund |
| Muted on dark | `#b7c4bc` | Sekundärtext auf dunklem Grund |
| Tint | `#e6f4f2` | Info-Karten (Notgroschen, Altersvorsorgedepot) |
| Savings bg / text | `#fbefe2` / `#8a4f16` | Sparpotenzial-Hinweise (Bernstein) |

Hinweis: In `src/styles.css` ist `--color-text` aktuell `#1f2937`; das Design nutzt `#12201a`.

## Typografie

- Überschriften und Beträge: **Space Grotesk** 600, Beträge mit `font-variant-numeric: tabular-nums`
- Fließtext: **IBM Plex Sans** 400/500/600
- Größen (Smartphone): H1 26 px, Kartentitel 17 px, große Zahl 28–34 px, Text 14 px, Meta 12–13 px

## Formen & Abstände

- Kartenradius 18–20 px, Buttons/Pills 12 px, runde Icon-Buttons 44×44 px
- Seitenrand 20 px (Smartphone), Kartenabstand 12–16 px, Innenabstand 16–18 px
- Touch-Ziele mindestens 44 px; Icons als Strich-SVG (2 px)

## Interaktionen im Entwurf

- Ziele: Tab-Umschaltung Aktiv/Erreicht
- Verträge: „Kündigen“ setzt den Eintrag auf „Vorbereitet ✓“
- Anlage: Sparplan-Rechner, Endwert = `rate × ((1 + i)^n − 1) / i` mit `i = 0,06 / 12`, `n = jahre × 12`
- Desktop: Bereichswechsel über die Seitenleiste
