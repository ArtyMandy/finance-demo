import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, FormField, min, submit } from '@angular/forms/signals';
import { Clock } from '../core/clock';
import { spendingByCategory } from '../data/analytics';
import { CATEGORIES } from '../data/categories';
import { FinanceStore } from '../data/finance-store';
import { formatEuroRounded, formatMonth } from '../shared/format';

const WARN_SHARE = 0.8;

const SPENDING_CATEGORIES = CATEGORIES.filter(
  (category) => !category.neutral && category.id !== 'einkommen',
);

type Status = 'none' | 'ok' | 'warning' | 'over';

@Component({
  imports: [FormField],
  selector: 'app-budgets',
  template: `
    <main id="inhalt" class="page">
      <div class="page-head">
        <div>
          <span class="eyebrow">{{ monthLabel() }}</span>
          <h1>Budgets</h1>
        </div>
      </div>
      <p class="meta">
        Monatliche Limits pro Kategorie. Ab {{ warnPercent }} % erscheint eine Warnung, bei
        Überschreitung zusätzlich ein Hinweis in der Übersicht.
      </p>

      <div class="grid-stats">
        <div class="card stat">
          <span class="label">Budget gesamt</span>
          <span class="stat-value">{{ eur(totalLimit()) }}</span>
        </div>
        <div class="card stat">
          <span class="label">Davon ausgegeben</span>
          <span class="stat-value">{{ eur(totalSpentInBudgets()) }}</span>
        </div>
        <div class="card stat" [class.card-savings]="overCount() > 0">
          <span class="label">Überschritten</span>
          <span class="stat-value" [class.savings-text]="overCount() > 0">{{ overCount() }}</span>
        </div>
      </div>

      <section class="card" aria-labelledby="budgets-heading">
        <h2 id="budgets-heading">Kategorien</h2>
        <ul class="list">
          @for (row of rows(); track row.id) {
            <li>
              <span class="list-main">
                <span class="spread">
                  <span class="list-title">{{ row.name }}</span>
                  <span class="amount">
                    {{ eur(row.spent) }}{{ row.limit ? ' von ' + eur(row.limit) : '' }}
                  </span>
                </span>
                @if (row.limit) {
                  <span class="bar" aria-hidden="true">
                    <span
                      [class.bar-warning]="row.status === 'warning'"
                      [class.bar-over]="row.status === 'over'"
                      [style.width.%]="row.percent"
                    ></span>
                  </span>
                  <span
                    class="meta"
                    [class.savings-text]="row.status === 'warning'"
                    [class.negative]="row.status === 'over'"
                  >
                    @switch (row.status) {
                      @case ('over') {
                        ⚠ Überschritten um {{ eur(row.spent - row.limit) }}
                      }
                      @case ('warning') {
                        ⚠ {{ row.share }} % verbraucht – noch {{ eur(row.limit - row.spent) }}
                      }
                      @default {
                        noch {{ eur(row.limit - row.spent) }} frei
                      }
                    }
                  </span>
                }
              </span>
              <button
                type="button"
                class="btn btn-ghost btn-small"
                (click)="open(row.id, row.name, row.limit)"
              >
                {{ row.limit ? 'Ändern' : 'Budget festlegen'
                }}<span class="visually-hidden">: {{ row.name }}</span>
              </button>
            </li>
          }
        </ul>
      </section>

      <dialog #dialog aria-labelledby="budget-title">
        <form class="dialog-body" novalidate (submit)="save(); $event.preventDefault()">
          <h2 id="budget-title">Budget: {{ editingName() }}</h2>
          <label class="field">
            Limit pro Monat (€)
            <input type="number" inputmode="decimal" step="1" [formField]="budgetForm.limit" />
            <span class="field-hint">0 entfernt das Budget.</span>
            @if (budgetForm.limit().touched() && budgetForm.limit().errors().length) {
              <span class="field-error">{{ budgetForm.limit().errors()[0].message }}</span>
            }
          </label>
          <div class="form-actions">
            <button type="submit" class="btn">Speichern</button>
            <button type="button" class="btn btn-secondary" (click)="dialog.close()">
              Abbrechen
            </button>
          </div>
        </form>
      </dialog>
    </main>
  `,
})
export class Budgets {
  private readonly store = inject(FinanceStore);
  private readonly clock = inject(Clock);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly eur = formatEuroRounded;
  protected readonly warnPercent = WARN_SHARE * 100;
  protected readonly monthLabel = computed(() => formatMonth(this.clock.month()));

  protected readonly rows = computed(() => {
    const spending = spendingByCategory(this.store.data(), this.clock.month());
    const budgets = this.store.data().budgets;
    return SPENDING_CATEGORIES.map((category) => {
      const spent = spending.find((entry) => entry.categoryId === category.id)?.amount ?? 0;
      const limit = budgets.find((budget) => budget.categoryId === category.id)?.limit ?? 0;
      const share = limit ? spent / limit : 0;
      const status: Status = !limit
        ? 'none'
        : share > 1
          ? 'over'
          : share >= WARN_SHARE
            ? 'warning'
            : 'ok';
      return {
        id: category.id,
        name: category.name,
        spent,
        limit,
        status,
        share: Math.round(share * 100),
        percent: Math.min(100, share * 100),
      };
    }).sort((a, b) => Number(!!b.limit) - Number(!!a.limit) || b.spent - a.spent);
  });

  protected readonly totalLimit = computed(() =>
    this.rows().reduce((sum, row) => sum + row.limit, 0),
  );
  protected readonly totalSpentInBudgets = computed(() =>
    this.rows()
      .filter((row) => row.limit)
      .reduce((sum, row) => sum + row.spent, 0),
  );
  protected readonly overCount = computed(
    () => this.rows().filter((row) => row.status === 'over').length,
  );

  protected readonly editingId = signal('');
  protected readonly editingName = signal('');
  protected readonly model = signal({ limit: 0 });
  protected readonly budgetForm = form(this.model, (s) =>
    min(s.limit, 0, { message: 'Das Limit darf nicht negativ sein.' }),
  );

  protected open(id: string, name: string, limit: number): void {
    this.editingId.set(id);
    this.editingName.set(name);
    this.budgetForm().reset({ limit });
    this.dialog().nativeElement.showModal();
  }

  protected save(): void {
    submit(this.budgetForm, async () => {
      this.store.setBudget(this.editingId(), this.model().limit || 0);
      this.dialog().nativeElement.close();
    });
  }
}
