import { Component, computed, inject, resource, signal } from '@angular/core';
import { form, FormField, min, pattern, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../core/auth';
import { Connectivity } from '../core/connectivity';
import { IncomeApi } from './income-api';

const currency = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const monthName = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric', timeZone: 'UTC' });

function formatMonth(isoDate: string): string {
  const [year, month] = isoDate.split('-').map(Number);
  return monthName.format(Date.UTC(year, month - 1, 1));
}

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-income',
  template: `
    <main class="income">
      <header class="income-header">
        <h1>Monatliches Einkommen</h1>
        <button type="button" class="link-button" [disabled]="offline()" (click)="signOut()">
          Abmelden
        </button>
      </header>
      <p class="hint">Angemeldet als {{ auth.user()?.email }}</p>

      <form class="income-form" novalidate (submit)="onSubmit(); $event.preventDefault()">
        <label>
          Monat
          <input type="month" placeholder="JJJJ-MM" [formField]="incomeForm.month" />
          @if (incomeForm.month().touched() && incomeForm.month().errors().length) {
            <span class="field-error">{{ incomeForm.month().errors()[0].message }}</span>
          }
        </label>

        <label>
          Betrag (€)
          <input type="number" step="0.01" inputmode="decimal" [formField]="incomeForm.amount" />
          @if (incomeForm.amount().touched() && incomeForm.amount().errors().length) {
            <span class="field-error">{{ incomeForm.amount().errors()[0].message }}</span>
          }
        </label>

        <button type="submit" class="button" [disabled]="busy() || offline()">Speichern</button>
      </form>
      <p class="hint">Gibt es für den Monat schon einen Eintrag, wird er überschrieben.</p>
      @if (offline()) {
        <p class="hint">
          Du bist offline. Speichern, Löschen und Abmelden gehen wieder, sobald du online bist.
        </p>
      }

      <div aria-live="polite">
        @if (message(); as text) {
          <p class="field-error">{{ text }}</p>
        }
      </div>

      <section aria-labelledby="list-heading">
        <h2 id="list-heading">Deine Einträge</h2>
        @if (incomes.error()) {
          <p class="field-error">
            Die Einträge konnten nicht geladen werden.{{ offline() ? ' Du bist offline.' : '' }}
          </p>
        } @else if (incomes.hasValue()) {
          @if (rows().length) {
            <table>
              <thead>
                <tr>
                  <th scope="col">Monat</th>
                  <th scope="col" class="amount">Betrag</th>
                  <th scope="col"><span class="visually-hidden">Aktionen</span></th>
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.id) {
                  <tr>
                    <td>{{ row.monthLabel }}</td>
                    <td class="amount">{{ row.amountLabel }}</td>
                    <td>
                      <button
                        type="button"
                        class="link-button"
                        [disabled]="busy() || offline()"
                        [attr.aria-label]="'Eintrag ' + row.monthLabel + ' löschen'"
                        (click)="remove(row.id)"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">Summe</th>
                  <td class="amount">{{ total() }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          } @else {
            <p>Noch keine Einträge.</p>
          }
        } @else {
          <p>Einträge werden geladen …</p>
        }
      </section>

      <a routerLink="/">Zur Startseite</a>
    </main>
  `,
  styles: `
    .income {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 36rem;
      margin: 0 auto;
      padding: 3rem 1rem;
    }

    .income-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
    }

    h1 {
      font-size: 2rem;
    }

    h2 {
      margin: 1rem 0 0.5rem;
      font-size: 1.25rem;
    }

    .hint {
      margin: 0;
      color: #475569;
    }

    .income-form {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 1rem;
    }

    label {
      display: flex;
      flex: 1 1 10rem;
      flex-direction: column;
      gap: 0.25rem;
      font-weight: 600;
    }

    input {
      padding: 0.625rem 0.75rem;
      border: 1px solid #64748b;
      border-radius: 0.5rem;
      font: inherit;
    }

    .field-error {
      margin: 0;
      color: #b91c1c;
      font-weight: 400;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 0.5rem;
      border-bottom: 1px solid #cbd5e1;
      text-align: left;
    }

    .amount {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    tfoot th,
    tfoot td {
      border-bottom: none;
      font-weight: 700;
    }

    .link-button {
      padding: 0;
      border: none;
      background: none;
      color: var(--color-primary);
      font: inherit;
      text-decoration: underline;
      cursor: pointer;
    }

    .link-button:disabled {
      color: #475569;
      cursor: not-allowed;
    }

    a {
      color: var(--color-primary);
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
})
export class Income {
  protected readonly auth = inject(Auth);
  private readonly api = inject(IncomeApi);
  private readonly router = inject(Router);
  private readonly connectivity = inject(Connectivity);

  protected readonly offline = computed(() => !this.connectivity.online());
  protected readonly busy = signal(false);
  protected readonly message = signal('');

  protected readonly incomes = resource({ loader: () => this.api.list() });

  protected readonly rows = computed(() =>
    (this.incomes.hasValue() ? this.incomes.value() : []).map((income) => ({
      id: income.id,
      monthLabel: formatMonth(income.month),
      amountLabel: currency.format(income.amount),
    })),
  );

  protected readonly total = computed(() =>
    currency.format(
      (this.incomes.hasValue() ? this.incomes.value() : []).reduce((sum, income) => sum + income.amount, 0),
    ),
  );

  protected readonly model = signal({ month: '', amount: 0 });

  protected readonly incomeForm = form(this.model, (s) => {
    required(s.month, { message: 'Bitte wähle einen Monat.' });
    pattern(s.month, /^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Bitte im Format JJJJ-MM eingeben.' });
    required(s.amount, { message: 'Bitte gib einen Betrag ein.' });
    min(s.amount, 0, { message: 'Der Betrag darf nicht negativ sein.' });
  });

  protected onSubmit(): void {
    submit(this.incomeForm, async () => {
      const { month, amount } = this.model();
      await this.run(async () => {
        await this.api.save(month, amount);
        this.incomeForm().reset({ month: '', amount: 0 });
      });
    });
  }

  protected async remove(id: number): Promise<void> {
    await this.run(() => this.api.remove(id));
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/anmelden');
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.message.set('');
    try {
      await action();
      this.incomes.reload();
    } catch (error) {
      this.message.set(`Das hat nicht geklappt: ${error instanceof Error ? error.message : ''}`);
    } finally {
      this.busy.set(false);
    }
  }
}
