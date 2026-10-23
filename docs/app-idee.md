# App-Idee: Finanz-demo

> **Kurzbeschreibung:** Eine App, die alle eigenen Finanzen an einem Ort zeigt – von Einnahmen über Ausgaben bis zum Vermögen – Sparpotenziale aufdeckt, Sparziele begleitet und verständlich erklärt, welche Möglichkeiten der Geldanlage es in Deutschland gibt.

---

## 1. Ziel

**Problem:** Konten, Depots, Verträge und Sparpläne liegen bei verschiedenen Anbietern. Es fehlt der Gesamtblick: Wohin fließt das Geld, wo lässt sich sparen, und was mache ich mit dem Ersparten?

**Lösung:** Eine zentrale App, die Konten und Depots automatisch verbindet, Ausgaben auswertet, Sparziele messbar macht und den Weg vom Sparen zum Anlegen aufzeigt – zugeschnitten auf deutsche Rahmenbedingungen (Steuern, Förderungen, Produkte).

**Zielgruppe:** Privatpersonen in Deutschland, die Transparenz über ihre Finanzen wollen – vom Einsteiger ohne Überblick bis zum Sparer, der mit dem Anlegen beginnen möchte.

**Nutzen:**
- Vollständige Transparenz: Einnahmen, Ausgaben, Vermögen auf einen Blick
- Konkrete Ersparnis durch erkannte Sparpotenziale
- Motivation durch sichtbaren Fortschritt bei Sparzielen
- Orientierung bei der Geldanlage, ohne Fachwissen vorauszusetzen

---

## 2. Funktionen

### Kernfunktionen (Must-have)

**Überblick & Transparenz**
- **Konten erfassen:** Girokonten, Kreditkarten, Tagesgeld und Depots als eigene Konten mit aktuellem Kontostand bzw. Wert anlegen, ohne Bankverbindung.
- **Buchungen erfassen:** Buchungen manuell eintragen oder per CSV-Datei aus dem Umsatzexport der ING importieren. Beim Import werden doppelte Buchungen erkannt und übersprungen. Buchungen dienen **nur** dazu, wiederkehrende Einnahmen und Ausgaben zu erkennen; sie fließen weder in Statistiken noch in Kontostände ein.
- **Einnahmen definieren:** Einnahmequellen (z. B. Gehalt, Nebenjob, Kindergeld) mit Nettobetrag und Rhythmus anlegen: einmalig, monatlich, quartalsweise oder jährlich. Jede Einnahme gilt **ab Monat** und optional **bis Monat** (leer = unbefristet). Ändert sich ein Betrag, z. B. durch eine Gehaltserhöhung, beginnt ab dem neuen Monat ein neuer Zeitraum, die Historie bleibt erhalten. Feste Ausgaben funktionieren nach demselben Prinzip. Bei einer festen Ausgabe kann ein eigenes Konto oder Depot angegeben werden, auf dem das Geld landet (z. B. Sparrate, ETF-Sparplan); sie zählt dann als Sparen statt als Ausgabe.
- **Automatische Kategorisierung:** Buchungen werden Kategorien zugeordnet (Wohnen, Lebensmittel, Mobilität …), manuell korrigierbar; erkannte Einnahmen und Ausgaben übernehmen die Kategorie.
- **Einnahmen-/Ausgaben-Analyse:** Monats- und Jahresauswertungen, Verlauf, Vergleich zum Vormonat. Alle Statistiken (Übersicht, Budgets, Auswertung) beruhen ausschließlich auf den definierten Einnahmen & Ausgaben und den Konten.
- **Vermögensübersicht:** Gesamtvermögen (Konten, Depots, Sachwerte) minus Schulden, mit Entwicklung über die Zeit. Sachwerte und Schulden lassen sich auf der Startseite per Checkbox ein- oder ausblenden.
- **Vorschau:** Welche Einnahmen und Ausgaben in diesem Monat fällig sind und was übrig bleibt.

**Sparpotenzial**
- **Vertrags- & Abo-Erkennung:** Wiederkehrende Einnahmen und Zahlungen in den Buchungen automatisch erkennen; übernommene Ausgaben landen im Vertragsordner.
- **Kündigungs-Assistent:** Erinnerung an Kündigungsfristen, Kündigungsschreiben direkt aus der App.
- **Sparhinweise:** Auffälligkeiten erkennen (z. B. doppelte Abos, steigende Kategorien, ungewöhnlich hohe Ausgaben).

**Budgets & Sparziele**
- **Budgets:** Monatliche Limits pro Kategorie mit Warnung bei Überschreitung.
- **Sparziele:** Ziel mit Betrag und Datum definieren (z. B. Notgroschen, Urlaub, Auto), Fortschritt verfolgen, nötige Monatsrate berechnen.
- **Notgroschen-Check:** Empfehlung für die Höhe der Rücklage auf Basis der eigenen Fixkosten.

**Geldanlage (Deutschland)**
- **Depot-Tracking:** Wertpapiere, ETFs, Sparpläne, Dividenden und Rendite im Überblick.
- **Anlage-Wissen:** Verständliche Erklärungen zu Tages-/Festgeld, ETFs, Aktien, Anleihen, Immobilien, Krypto – mit Chancen, Risiken, Kosten.
- **Steuer-Helfer:** Sparerpauschbetrag (1.000 € / 2.000 € bei Zusammenveranlagung), Verteilung der Freistellungsaufträge über alle Banken, Vorabpauschale-Rechner.
- **Altersvorsorge-Übersicht:** Gesetzliche Rente, betriebliche Altersvorsorge, Riester/Rürup sowie das neue Altersvorsorgedepot ab 2027 (Zulagen, Förderrechner).
- **Sparplan-Rechner:** Was wird aus X € im Monat in Y Jahren (Zinseszins, Szenarien).

### Erweiterungen (Nice-to-have)

- **Anbieter-Vergleich:** Tagesgeldzinsen, Broker-/Depotkosten, Sparplan-Konditionen.
- **Frühstart-Rente:** Übersicht und Planung für Kinder, sobald das Gesetz in Kraft ist.
- **Gemeinsame Finanzen:** Geteilte Konten und Budgets für Paare und Familien.
- **KI-Assistent:** Fragen in natürlicher Sprache („Wie viel habe ich 2026 für Essen ausgegeben?“), automatische Monatsberichte.
- **Finanz-Gesundheitscheck:** Score aus Sparquote, Rücklage, Schulden und Vorsorge mit Verbesserungsvorschlägen.
- **Vertragsoptimierung:** Hinweise auf günstigere Tarife (Strom, Handy, Versicherungen).
- **Steuer-Export:** Relevante Belege und Kapitalerträge für die Steuererklärung bündeln.
- **Beleg-Scan:** Kassenbons fotografieren und Bargeldausgaben erfassen.
- **Datenexport:** CSV/Excel für eigene Auswertungen.

---

## 3. Rahmen

- **Plattform:** Website als Progressive Web App (PWA) für Desktop, Tablet und Smartphone
- **Abgrenzung:** Keine individuelle Anlageberatung und keine Kaufempfehlungen – die App informiert und rechnet, die Entscheidung trifft der Nutzer (Anlageberatung wäre erlaubnispflichtig).
- **Offene Fragen:**
  - Später weitere Banken beim CSV-Import unterstützen?
  - Wie aktuell werden Steuer- und Förderregeln gepflegt?
