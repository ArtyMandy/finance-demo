import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, FormField, min, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Clock } from '../core/clock';
import { plannedIncome } from '../data/analytics';
import { FinanceStore, newId } from '../data/finance-store';
import { PENSION_TYPE_LABELS, PensionEntry, PensionType } from '../data/models';
import { RULES } from '../rules/rules';
import { formatEuro, formatPercent } from '../shared/format';
import { PensionCalculator } from './pension-calculator';

@Component({
  imports: [FormField, PensionCalculator, RouterLink],
  selector: 'app-pension',
  templateUrl: './pension.html',
  styles: `
    .facts {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      margin: 0;
      padding-left: 1.25rem;
      font-size: 0.875rem;
    }
  `,
})
export class Pension {
  private readonly store = inject(FinanceStore);
  private readonly clock = inject(Clock);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly eur = formatEuro;
  protected readonly pct = formatPercent;
  protected readonly av = RULES.altersvorsorgedepot;
  protected readonly fruehstart = RULES.fruehstartRente;
  protected readonly types = Object.entries(PENSION_TYPE_LABELS) as [PensionType, string][];
  protected readonly typeLabel = (type: PensionType) => PENSION_TYPE_LABELS[type];

  protected readonly entries = computed(() => this.store.data().pension);
  protected readonly expected = computed(() =>
    this.entries().reduce((sum, e) => sum + e.expectedMonthly, 0),
  );
  protected readonly contributions = computed(() =>
    this.entries().reduce((sum, e) => sum + e.monthlyContribution, 0),
  );
  protected readonly netIncome = computed(() =>
    plannedIncome(this.store.data(), this.clock.month()),
  );
  protected readonly coverage = computed(() =>
    this.netIncome() ? this.expected() / this.netIncome() : 0,
  );

  protected readonly editing = signal<PensionEntry | undefined>(undefined);
  protected readonly model = signal({
    type: 'gesetzlich' as string,
    name: '',
    expectedMonthly: 0,
    monthlyContribution: 0,
  });
  protected readonly entryForm = form(this.model, (s) => {
    required(s.name, { message: 'Bitte gib eine Bezeichnung ein.' });
    min(s.expectedMonthly, 0, { message: 'Der Betrag darf nicht negativ sein.' });
    min(s.monthlyContribution, 0, { message: 'Der Betrag darf nicht negativ sein.' });
  });

  protected open(entry?: PensionEntry): void {
    this.editing.set(entry);
    this.entryForm().reset(
      entry
        ? { ...entry }
        : { type: 'gesetzlich', name: '', expectedMonthly: 0, monthlyContribution: 0 },
    );
    this.dialog().nativeElement.showModal();
  }

  protected save(): void {
    submit(this.entryForm, async () => {
      const value = this.model();
      this.store.save('pension', {
        ...value,
        id: this.editing()?.id ?? newId(),
        name: value.name.trim(),
        type: value.type as PensionType,
      });
      this.dialog().nativeElement.close();
    });
  }

  protected remove(entry: PensionEntry): void {
    this.store.remove('pension', entry.id);
    this.dialog().nativeElement.close();
  }
}
