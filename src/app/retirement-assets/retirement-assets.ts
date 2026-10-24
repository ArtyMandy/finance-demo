import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Clock } from '../core/clock';
import { FinanceStore } from '../data/finance-store';
import { ACCOUNT_TYPE_LABELS } from '../data/models';
import { RetirementKind, retirementStatus } from '../data/retirement';
import { formatEuro, formatEuroRounded } from '../shared/format';
import { RetirementProjection } from './retirement-projection';

const KIND_LABELS: Record<RetirementKind, string> = {
  depot: 'Depots',
  realEstate: 'Immobilien (netto)',
  cash: 'Tagesgeld',
};

/** Vorsorgevermögen: capital set aside for retirement, separate from the expected pensions. */
@Component({
  imports: [RetirementProjection, RouterLink],
  selector: 'app-retirement-assets',
  templateUrl: './retirement-assets.html',
})
export class RetirementAssets {
  private readonly store = inject(FinanceStore);
  private readonly clock = inject(Clock);

  protected readonly eur = formatEuro;
  protected readonly eurRounded = formatEuroRounded;
  protected readonly typeLabel = ACCOUNT_TYPE_LABELS;

  protected readonly status = computed(() =>
    retirementStatus(this.store.data(), this.clock.month()),
  );
  protected readonly kinds = computed(() =>
    (Object.keys(KIND_LABELS) as RetirementKind[]).map((kind) => ({
      kind,
      label: KIND_LABELS[kind],
      value: this.status().byKind[kind],
    })),
  );
  protected readonly loanName = (id: string) =>
    this.store.data().accounts.find((account) => account.id === id)?.name ?? '';
}
