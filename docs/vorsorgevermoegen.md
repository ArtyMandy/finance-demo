# Feature: Vorsorgevermögen

> **Kurzbeschreibung:** Eigener Menüpunkt „Vorsorgevermögen“, der den Ist-Stand des Kapitals zeigt, das für das Alter zurückgelegt ist (Depots, Tagesgeld, vermietete Immobilien, Sparpläne), und hochrechnet, wie es sich bis zum Rentenbeginn entwickeln kann – inklusive Kapitalertragsteuer.

Ergänzt die bestehende Seite **Altersvorsorge** (erwartete Renten + Förderrechner), ersetzt sie aber nicht. Altersvorsorge = monatliche Renten, Vorsorgevermögen = angespartes Kapital.

---

## 1. Funktionen

### Zuordnung
- Konten vom Typ **Depot**, **Tagesgeld** und **Sachwert** erhalten den Schalter „Zählt zum Vorsorgevermögen“ (Ja/Nein pro Konto).
- Soll nur ein Teil eines Depots zählen, legt man dafür ein eigenes Depot-Konto an (keine Prozent-Anteile im ersten Schritt).
- **Immobilien:** nur vermietete oder als Kapitalanlage gehaltene Objekte; die selbst genutzte Immobilie zählt nicht. Optional wird ein Kredit verknüpft, dann zählt der Wert abzüglich Restschuld.

### Ist-Stand
- Vorsorgevermögen gesamt, aufgeteilt nach Depots, Immobilien (netto) und Tagesgeld.
- Summe der Sparraten pro Monat:
  - Depots: Sparplan-Raten der Positionen; nur wenn keine erfasst sind, zählen wiederkehrende Sparraten mit dem Depot als Zielkonto (keine Doppelzählung).
  - Tagesgeld: wiederkehrende Sparraten mit dem Konto als Zielkonto.
- Liste der zugeordneten Konten mit aktuellem Wert.

### Hochrechnung bis Rentenbeginn
- Profil: **Geburtsjahr** und **Renteneintrittsalter** (Standard 67) ergeben die Laufzeit.
- Annahmen (änderbar): Rendite Depot (Standard 5 %), Tagesgeldzins nach Steuern (1,5 %), Wertsteigerung Immobilien (0 %), jährliche Dynamik der Sparraten (0 %), Inflation (2 %).
- Szenarien 2 / 4 / 6 / 8 % für die Depot-Rendite.
- Monatliche Verzinsung mit Jahreszins / 12, Sparrate am Monatsende (wie der Sparplan-Rechner); Dynamik einmal pro Jahr.
- Verknüpfte Kredite bleiben auf dem heutigen Stand (Tilgung wird nicht gerechnet).
- Verlauf als Liniendiagramm, nominal oder inflationsbereinigt.

### Kapitalertragsteuer
Ausweis **Brutto-Endwert → geschätzte Steuer → Netto-Endwert**:

- Annahme: alle Depots werden zum Rentenbeginn auf einmal verkauft.
- Gewinn je Depot = Endwert − Einstand (Kaufwert der Positionen) − künftige Einzahlungen; ohne erfasste Positionen gilt der heutige Wert als Einstand.
- Teilfreistellung nach Anlageart, gewichtet nach Wert: ETF = Aktienfonds (30 %), Fonds = Mischfonds (15 %), Aktie/Anleihe/Sonstiges = 0 %. Krypto ist kein Kapitalertrag (nach 1 Jahr steuerfrei) und wird nicht besteuert.
- Sparerpauschbetrag einmalig (1.000 € / 2.000 € bei Zusammenveranlagung), Steuersatz inkl. Soli und Kirchensteuer laut Profil.
- Vorabpauschale wird nicht einzeln gerechnet; Tagesgeldzinsen werden jährlich versteuert (Zins nach Steuern).
- Immobilien: Verkauf nach 10 Jahren Haltedauer steuerfrei (§ 23 EStG) – nur Hinweis, keine Berechnung.

### Startseite
- Die Kachel „Gesamtvermögen“ bekommt den Schalter „Vorsorgevermögen einrechnen“ (neben den bestehenden Filtern für Sachwerte und Schulden). Er erscheint, sobald ein Konto zum Vorsorgevermögen zählt.
- Ein: Die Aufteilung zeigt zusätzlich „davon Vorsorge …“.
- Aus: Gesamtvermögen, Aufteilung, Sparkline, Vermögensentwicklung und Veränderung ohne die Vorsorge-Konten und ohne die Kredite, die mit vorsorgerelevanten Immobilien verknüpft sind.
- Die Einstellung wird in den Finanzdaten gespeichert und synchronisiert.

### Abgrenzung
Alle Werte sind Annahmen und Rechenbeispiele, keine Prognose und keine Anlageberatung. Mieteinnahmen sind im ersten Schritt nicht enthalten.

---

## 2. Umsetzung (je ein PR)

1. **Datenmodell & Logik:** `Account.retirement`, `Account.linkedLoanId`, `Profile.birthYear`, `Profile.retirementAge`, `FinanceData.retirementAssumptions`, `WealthOptions.includeRetirement`; Standardwerte in `RULES.vorsorge`; Berechnung in `src/app/data/retirement.ts` mit Tests.
2. **Seite „Vorsorgevermögen“:** Menüpunkt unter „Altersvorsorge“, Route `/vorsorgevermoegen`, Ist-Stand, Schalter am Konto, Profilfelder.
3. **Hochrechnung:** Annahmen-Formular, Szenarien, Diagramm, Steuer-Ausweis.
4. **Startseite:** Schalter „Vorsorgevermögen einbeziehen“.
