import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  id: string;
  title: string;
  summary: string;
  chances: string[];
  risks: string[];
  costs: string[];
  risk: 1 | 2 | 3 | 4 | 5;
}

const RISK_LABELS = ['', 'sehr gering', 'gering', 'mittel', 'hoch', 'sehr hoch'];

const TOPICS: readonly Topic[] = [
  {
    id: 'tagesgeld',
    title: 'Tagesgeld',
    summary: 'Verzinstes Konto, jederzeit verfügbar. Typischer Ort für den Notgroschen.',
    chances: [
      'Täglich verfügbar',
      'Zinsen ohne Kursschwankungen',
      'Einlagensicherung bis 100.000 € pro Person und Bank in der EU',
    ],
    risks: [
      'Zins kann jederzeit sinken',
      'Inflation kann höher sein als der Zins (Kaufkraftverlust)',
    ],
    costs: ['In der Regel kostenlos', 'Lockangebote gelten oft nur für wenige Monate'],
    risk: 1,
  },
  {
    id: 'festgeld',
    title: 'Festgeld',
    summary: 'Geld wird für eine feste Laufzeit zu einem festen Zins angelegt.',
    chances: [
      'Zins für die ganze Laufzeit sicher',
      'Planbarer Ertrag',
      'Einlagensicherung wie beim Tagesgeld',
    ],
    risks: [
      'Vor Laufzeitende meist nicht verfügbar',
      'Steigen die Zinsen, bleibt man beim alten Satz',
    ],
    costs: ['Meist kostenlos'],
    risk: 1,
  },
  {
    id: 'etf',
    title: 'ETFs (Indexfonds)',
    summary:
      'Börsengehandelte Fonds, die einen Index wie den MSCI World abbilden – viele Unternehmen in einem Produkt.',
    chances: [
      'Breite Streuung schon mit kleinen Beträgen',
      'Langfristig Teilhabe an der Wirtschaftsentwicklung',
      'Sparpläne ab wenigen Euro im Monat',
    ],
    risks: [
      'Kursschwankungen, auch Verluste von 30–50 % in Krisen',
      'Kein Kapitalschutz',
      'Wechselkursrisiken bei Fremdwährungen',
    ],
    costs: [
      'Laufende Kosten (TER) oft 0,05–0,5 % p. a.',
      'Ordergebühren je nach Broker',
      'Vorabpauschale bei thesaurierenden Fonds',
    ],
    risk: 3,
  },
  {
    id: 'aktien',
    title: 'Aktien',
    summary: 'Anteile an einzelnen Unternehmen. Gewinne über Kurssteigerungen und Dividenden.',
    chances: ['Hohe Renditechancen', 'Dividenden', 'Mitspracherecht als Miteigentümer'],
    risks: [
      'Hohes Einzelrisiko bis zum Totalverlust',
      'Starke Schwankungen',
      'Verluste nur mit Aktiengewinnen verrechenbar',
    ],
    costs: ['Ordergebühren', 'Spreads beim Kauf und Verkauf', 'Depotgebühren je nach Anbieter'],
    risk: 4,
  },
  {
    id: 'anleihen',
    title: 'Anleihen',
    summary: 'Man leiht einem Staat oder Unternehmen Geld und bekommt dafür Zinsen.',
    chances: [
      'Regelmäßige Zinszahlungen',
      'Bei Laufzeitende Rückzahlung zum Nennwert (wenn der Schuldner zahlt)',
      'Gegengewicht zu Aktien',
    ],
    risks: [
      'Ausfallrisiko des Schuldners',
      'Kursverluste bei steigenden Zinsen',
      'Geringere Renditechancen als Aktien',
    ],
    costs: ['Ordergebühren', 'Bei Anleihe-ETFs laufende Kosten'],
    risk: 2,
  },
  {
    id: 'immobilien',
    title: 'Immobilien',
    summary: 'Selbst genutzt oder vermietet, direkt oder indirekt über Fonds und REITs.',
    chances: [
      'Sachwert mit Mieteinnahmen',
      'Mietfreies Wohnen im Alter',
      'Wohnungsbauprämie und Altersvorsorgedepot-Entnahme für Wohneigentum',
    ],
    risks: [
      'Klumpenrisiko: viel Geld in einem Objekt',
      'Schwer verkäuflich',
      'Instandhaltung, Leerstand, Zinsänderungen bei Krediten',
    ],
    costs: [
      'Kaufnebenkosten oft 10–15 % (Grunderwerbsteuer, Notar, Makler)',
      'Laufende Instandhaltung',
      'Finanzierungszinsen',
    ],
    risk: 3,
  },
  {
    id: 'krypto',
    title: 'Kryptowährungen',
    summary: 'Digitale Werte wie Bitcoin, ohne Zentralbank. Sehr spekulativ.',
    chances: ['Sehr hohe Kurssprünge möglich', 'Rund um die Uhr handelbar'],
    risks: [
      'Extreme Schwankungen bis zum Totalverlust',
      'Kein innerer Wert, keine Einlagensicherung',
      'Betrug, Hacks und Verlust der Zugangsdaten',
    ],
    costs: [
      'Handelsgebühren und Spreads oft hoch',
      'Verwahrgebühren',
      'Gewinne nach weniger als einem Jahr sind steuerpflichtig',
    ],
    risk: 5,
  },
];

@Component({
  imports: [RouterLink],
  selector: 'app-knowledge',
  template: `
    <main id="inhalt" class="page">
      <div class="page-head">
        <div>
          <span class="eyebrow">Geldanlage in Deutschland verständlich erklärt</span>
          <h1>Anlage-Wissen</h1>
        </div>
      </div>

      <section class="card card-tint" aria-labelledby="basics-heading">
        <h2 id="basics-heading">Die Reihenfolge, die sich bewährt hat</h2>
        <ol class="steps">
          <li>
            <strong>Überblick:</strong> Einnahmen und Ausgaben kennen, teure Schulden zuerst
            abbauen.
          </li>
          <li>
            <strong>Notgroschen:</strong> 3–6 Monatsausgaben auf dem Tagesgeld (<a
              routerLink="/ziele"
              >Notgroschen-Check</a
            >).
          </li>
          <li>
            <strong>Vorsorge:</strong> Förderungen nutzen, z. B. Arbeitgeberzuschüsse, VL,
            <a routerLink="/altersvorsorge">Altersvorsorgedepot</a>.
          </li>
          <li>
            <strong>Langfristig anlegen:</strong> Geld, das 10 Jahre und länger nicht gebraucht
            wird, breit gestreut anlegen.
          </li>
        </ol>
        <p class="meta">
          Grundregeln: Rendite und Risiko gehören zusammen. Streuung senkt das Risiko einzelner
          Anlagen. Kosten schmälern die Rendite jedes Jahr. Je länger der Anlagezeitraum, desto eher
          lassen sich Schwankungen aussitzen.
        </p>
      </section>

      <div class="grid">
        @for (topic of topics; track topic.id) {
          <article class="card" [attr.aria-labelledby]="'topic-' + topic.id">
            <div class="spread">
              <h2 [id]="'topic-' + topic.id">{{ topic.title }}</h2>
              <span class="pill" [class.pill-warning]="topic.risk >= 4"
                >Risiko: {{ riskLabel(topic.risk) }}</span
              >
            </div>
            <p>{{ topic.summary }}</p>
            <div class="risk" aria-hidden="true">
              @for (step of steps; track step) {
                <span [class.on]="step <= topic.risk"></span>
              }
            </div>
            <details>
              <summary>
                Chancen, Risiken, Kosten<span class="visually-hidden"> von {{ topic.title }}</span>
              </summary>
              <h3>Chancen</h3>
              <ul>
                @for (item of topic.chances; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
              <h3>Risiken</h3>
              <ul>
                @for (item of topic.risks; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
              <h3>Kosten</h3>
              <ul>
                @for (item of topic.costs; track item) {
                  <li>{{ item }}</li>
                }
              </ul>
            </details>
          </article>
        }
      </div>

      <p class="disclaimer">
        Allgemeine Informationen, keine Anlageberatung und keine Kaufempfehlung. Die Entscheidung
        triffst du selbst.
      </p>
    </main>
  `,
  styles: `
    .steps,
    ul {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin: 0;
      padding-left: 1.25rem;
      font-size: 0.875rem;
    }
    h3 {
      margin: 0.75rem 0 0.25rem;
      font-size: 0.875rem;
    }
    .risk {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 2px;
    }
    .risk span {
      height: 0.375rem;
      border-radius: 3px;
      background: var(--color-border);
    }
    .risk span.on {
      background: var(--color-text);
    }
  `,
})
export class Knowledge {
  protected readonly topics = TOPICS;
  protected readonly steps = [1, 2, 3, 4, 5];
  protected readonly riskLabel = (risk: number) => RISK_LABELS[risk];
}
