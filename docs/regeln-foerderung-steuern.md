# Finanz-demo – Regeln: Förderung & Steuern

> Stand: 18. Oktober 2026. Grundlage für Rechner und Hinweise in der App. Werte können sich durch Gesetzesänderungen ändern und sollten jährlich geprüft werden. Keine Steuer- oder Anlageberatung.

---

## 1. Altersvorsorgedepot (ab 1. Januar 2027)

**Status:** Beschlossen (Bundestag 27.03.2026, Bundesrat 08.05.2026). Ersetzt Riester für Neuverträge.

**Förderberechtigt**
- Gesetzlich Rentenversicherungspflichtige, Beamte, Pflichtmitglieder berufsständischer Versorgungswerke (angestellt) und neu auch Selbstständige
- Nicht unmittelbar: freiwillig Versicherte, befreite Minijobber, Bezieher einer Altersvollrente

**Förderung pro Jahr**

| Baustein | Regel | Maximum |
|---|---|---|
| Grundzulage Stufe 1 | 50 % auf Eigenbeitrag bis 360 € | 180 € |
| Grundzulage Stufe 2 | 25 % auf Eigenbeitrag von 360 € bis 1.800 € | 360 € |
| Grundzulage gesamt | | **540 €** |
| Kinderzulage | 100 % auf Eigenbeitrag bis 300 € je Kind | 300 € je Kind |
| Berufseinsteigerbonus | einmalig bei Abschluss vor dem 25. Geburtstag | 200 € |

- Mindesteigenbeitrag: 120 € pro Jahr
- Einzahlung bis 6.840 € pro Jahr möglich, gefördert werden nur 1.800 €
- Beiträge inkl. Zulagen sind als Sonderausgaben absetzbar; das Finanzamt prüft automatisch, ob Zulage oder Steuerabzug günstiger ist (Günstigerprüfung)
- Höchstens 2 geförderte Verträge pro Person

**Produkt & Anlage**
- **Standarddepot:** Pflichtangebot jedes Anbieters, Effektivkosten max. 1,0 % p. a.
- **Frei gestaltetes Depot:** ohne Kostendeckel
- Optional Garantieprodukte (80 % oder 100 % Kapitalschutz)
- Erlaubt: Fonds/ETFs mit Risikoklasse ≤ 5 (z. B. breite Welt-ETFs), bis 100 % Aktien; ausgeschlossen: Krypto, Hebelprodukte
- Ansparphase steuerfrei: keine Vorabpauschale, Umschichten ohne Steuer
- Anbieterwechsel nach 5 Jahren kostenlos (neuer Anbieter max. 150 €)

**Auszahlung**
- Beginn frühestens mit 65, spätestens mit 70 (früher nur bei Bezug der gesetzlichen Rente)
- Als lebenslange Rente oder Auszahlplan bis mindestens 85
- Geförderte Anteile werden voll mit dem persönlichen Einkommensteuersatz versteuert (nachgelagert)

**Vorzeitige Entnahme**
- Förderschädlich: Zulagen und Steuervorteile müssen zurückgezahlt werden
- Ausnahme: Verwendung für selbstgenutztes Wohneigentum

**Riester-Bestand:** Alte Verträge laufen weiter (Bestandsschutz). Wechsel ins neue System ist freiwillig, aber nicht umkehrbar.

**App-Formel Grundzulage:**
`zulage = min(beitrag, 360) × 0,5 + max(0, min(beitrag, 1.800) − 360) × 0,25` (nur wenn `beitrag ≥ 120`)

**Ausblick Frühstart-Rente:** 10 € pro Monat vom Staat für Kinder von 6 bis 18 Jahren ins Standarddepot, Start geplant 01.01.2027 (Jahrgänge 2020/2021). Vom Bundestag am 16.10.2026 beschlossen, Zustimmung des Bundesrats steht noch aus. In der App erst aktivieren, wenn das Gesetz verkündet ist.

---

## 2. Kapitalertragsteuer – ab wann sie gezahlt wird

**Steuerpflichtige Erträge:** Zinsen, Dividenden, realisierte Kursgewinne, Fondsausschüttungen und Vorabpauschale.

**Grundregel:** Steuer fällt erst an, wenn die Kapitalerträge eines Kalenderjahres den **Sparerpauschbetrag** übersteigen:
- 1.000 € für Einzelpersonen
- 2.000 € bei Zusammenveranlagung
- Kinder haben einen eigenen Pauschbetrag

**Steuersatz auf den übersteigenden Betrag**

| Konstellation | Satz |
|---|---|
| Abgeltungsteuer 25 % + Soli 5,5 % | 26,375 % |
| mit 8 % Kirchensteuer (BY, BW) | ca. 27,82 % |
| mit 9 % Kirchensteuer (übrige Länder) | ca. 27,99 % |

**Regeln für die Berechnung**
- **Freistellungsauftrag:** Nur damit zieht die Bank keine Steuer ab. Die Summe aller Aufträge bei allen Banken darf den Pauschbetrag nicht überschreiten.
- **Zeitpunkt:** Dividenden und Zinsen bei Gutschrift, Kursgewinne beim Verkauf, Vorabpauschale Anfang Januar für das Vorjahr.
- **Teilfreistellung bei Fonds:** Aktienfonds (≥ 51 % Aktien) 30 % steuerfrei, Mischfonds (≥ 25 %) 15 %, sonstige 0 %.
- **Vorabpauschale 2026:** `Fondswert zu Jahresbeginn × Basiszins 2,29 % × 0,7`, höchstens der tatsächliche Wertzuwachs; wird beim späteren Verkauf angerechnet.
- **Verluste:** Aktienverluste nur mit Aktiengewinnen verrechenbar, alle anderen Verluste im allgemeinen Topf.
- **Günstigerprüfung:** Liegt der persönliche Steuersatz unter 25 %, gibt es die Differenz über die Steuererklärung (Anlage KAP) zurück.
- **NV-Bescheinigung:** Liegt das Gesamteinkommen unter dem Grundfreibetrag (2026: 12.348 €), zahlt die Bank auch über 1.000 € ohne Abzug aus.
- **Ausländische Broker:** führen keine Steuer ab; Erträge müssen selbst in der Anlage KAP angegeben werden.
- **Ausnahme:** Erträge im Altersvorsorgedepot sind in der Ansparphase steuerfrei (siehe 1).

**App-Formel:**
`steuer = max(0, kapitalerträge_nach_teilfreistellung − freistellung_genutzt) × steuersatz`

---

## 3. Wohnungsbauprämie (Bausparen)

**Funktionsweise:** Der Staat zahlt einen Zuschuss auf eigene Einzahlungen in einen Bausparvertrag.

| Regel | Einzelperson | Paar (verheiratet / eingetr. Partnerschaft) |
|---|---|---|
| Prämie | 10 % der Einzahlung | 10 % der Einzahlung |
| Geförderter Höchstbetrag | 700 € / Jahr | 1.400 € / Jahr |
| Max. Prämie | 70 € / Jahr | 140 € / Jahr |
| Einkommensgrenze (zu versteuerndes Einkommen) | 35.000 € | 70.000 € |

- Mindestalter 16, Wohnsitz in Deutschland, Mindesteinzahlung 50 € pro Jahr
- Einkommensgrenze wird jedes Jahr einzeln geprüft; wird sie überschritten, entfällt die Prämie nur für dieses Jahr
- **Verwendung:** Bei Verträgen ab 2009 nur für wohnwirtschaftliche Zwecke (Kauf, Bau, Modernisierung, energetische Sanierung, Umschuldung)
- **Ausnahme unter 25:** Vertrag vor dem 25. Geburtstag abgeschlossen → nach 7 Jahren oder Zuteilung einmalig frei verfügbar
- **Antrag:** jährlich über die Bausparkasse, rückwirkend bis Ende des zweiten Folgejahres
- **Auszahlung:** gesammelt mit dem Bausparguthaben bei Zuteilung, nicht laufend
- Seit 2024 zählen vermögenswirksame Leistungen nicht mehr für die Prämie; Prämie und Arbeitnehmersparzulage nicht auf denselben Betrag

**App-Formel:**
`prämie = min(eigene_einzahlung, 700 bzw. 1.400) × 0,10` (nur wenn `zvE ≤ 35.000 bzw. 70.000` und `einzahlung ≥ 50`)

---

## 4. VL-Sparen & Arbeitnehmersparzulage

**Funktionsweise:** Der Arbeitgeber zahlt vermögenswirksame Leistungen (VL) direkt in einen Sparvertrag des Arbeitnehmers. Ob und wie viel er zahlt, regeln Tarif- oder Arbeitsvertrag; der Arbeitnehmer kann auch eigenes Gehalt umwandeln. Zusätzlich zahlt der Staat die Arbeitnehmersparzulage.

| Anlageform | Zulage | Geförderter Höchstbetrag | Max. Zulage / Jahr |
|---|---|---|---|
| Fonds-/Wertpapiersparplan (Beteiligungen) | 20 % | 400 € | 80 € |
| Bausparvertrag / Wohnungsbau | 9 % | 470 € | 42,30 € |

- Beide Formen parallel möglich: zusammen bis 122,30 € pro Jahr
- **Einkommensgrenze (seit 2024):** zu versteuerndes Einkommen bis 40.000 € (Einzelperson) bzw. 80.000 € (Zusammenveranlagung); Kinderfreibeträge werden dabei abgezogen
- **Sperrfrist:** in der Regel 7 Jahre
- **Antrag:** jährlich mit der Einkommensteuererklärung, spätestens bis Ende des 4. Jahres nach dem Sparjahr; der Anbieter meldet die Daten elektronisch ans Finanzamt
- **Auszahlung:** Die Zulagen werden gesammelt und nach Ablauf der Sperrfrist in einer Summe an den Anbieter gezahlt

**App-Formel:**
`zulage = min(vl_fonds, 400) × 0,20 + min(vl_bausparen, 470) × 0,09` (nur wenn `zvE ≤ 40.000 bzw. 80.000`)
