import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { categoryName } from '../data/categories';
import { FinanceStore } from '../data/finance-store';
import { ContractSuggestion, detectContracts } from '../data/insights';
import { RecurringItem, Rhythm, RHYTHM_LABELS } from '../data/models';
import { formatEuro } from './format';

/** Recurring income and payments found in the bookings, ready to take over. */
@Component({
  imports: [RouterLink],
  selector: 'app-recurring-suggestions',
  template: `
    @if (suggestions().length) {
      <section class="card" aria-labelledby="detected-heading">
        <h2 id="detected-heading">In deinen Buchungen erkannt</h2>
        <p class="meta">
          Wiederkehrende {{ kind() === 'expense' ? 'Zahlungen' : 'Einnahmen und Ausgaben' }} aus
          deinen <a routerLink="/buchungen">Buchungen</a>. Übernehmen legt sie unter Einnahmen &amp;
          Fixkosten an, erst dann fließen sie in Übersicht und Auswertung ein.
        </p>
        <ul class="list">
          @for (suggestion of suggestions(); track suggestion.key) {
            <li>
              <span class="avatar" aria-hidden="true">{{ suggestion.name.charAt(0) }}</span>
              <span class="list-main">
                <span class="list-title">{{ suggestion.name }}</span>
                <span class="meta"
                  >{{ suggestion.kind === 'income' ? 'Einnahme' : 'Ausgabe' }} ·
                  {{ suggestion.count }}× {{ rhythm(suggestion.rhythm) }} ·
                  {{ category(suggestion.categoryId) }}</span
                >
              </span>
              <span class="amount list-title" [class.positive]="suggestion.kind === 'income'">
                {{ suggestion.kind === 'income' ? '+' : '−' }}{{ eur(suggestion.amount) }}
              </span>
              <span class="row">
                <button type="button" class="btn btn-small" (click)="accept(suggestion)">
                  Übernehmen<span class="visually-hidden">: {{ suggestion.name }}</span>
                </button>
                <button type="button" class="btn btn-ghost btn-small" (click)="dismiss(suggestion)">
                  Ignorieren<span class="visually-hidden">: {{ suggestion.name }}</span>
                </button>
              </span>
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class RecurringSuggestions {
  private readonly store = inject(FinanceStore);

  /** Shows only income or only expenses; both when empty. */
  readonly kind = input<RecurringItem['kind'] | ''>('');

  protected readonly suggestions = computed(() =>
    detectContracts(this.store.data()).filter((s) => !this.kind() || s.kind === this.kind()),
  );

  protected readonly eur = formatEuro;
  protected readonly category = categoryName;
  protected readonly rhythm = (rhythm: Rhythm) => RHYTHM_LABELS[rhythm];

  protected accept(suggestion: ContractSuggestion): void {
    this.store.acceptSuggestion(suggestion);
  }

  protected dismiss(suggestion: ContractSuggestion): void {
    this.store.dismissSuggestion(suggestion.key);
  }
}
