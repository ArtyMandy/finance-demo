import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import {
  form,
  FormField,
  hidden,
  min,
  pattern,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { Clock } from '../core/clock';
import { CATEGORIES } from '../data/categories';
import { FinanceStore, newId } from '../data/finance-store';
import { RecurringItem, RHYTHM_LABELS, Rhythm } from '../data/models';
import { DATE_PATTERN, MONTH_PATTERN } from '../data/months';

type Kind = RecurringItem['kind'];

function emptyModel(kind: Kind, month: string) {
  return {
    kind: kind as string,
    name: '',
    amount: 0,
    rhythm: 'monthly' as string,
    from: month,
    to: '',
    categoryId: kind === 'income' ? 'einkommen' : 'wohnen',
    provider: '',
    customerNumber: '',
    cancelBy: '',
    monthlyCancelable: false,
  };
}

/** Dialog to create or edit an income source or a fixed expense (incl. contract details). */
@Component({
  imports: [FormField],
  selector: 'app-recurring-form',
  template: `
    <dialog #dialog aria-labelledby="recurring-title">
      <form class="dialog-body" novalidate (submit)="save(); $event.preventDefault()">
        <h2 id="recurring-title">{{ title() }}</h2>
        <div class="form">
          <label class="field">
            Art
            <select [formField]="recurringForm.kind">
              <option value="income">Einnahme</option>
              <option value="expense">Fixe Ausgabe / Vertrag</option>
            </select>
          </label>
          <label class="field">
            Bezeichnung
            <input type="text" [formField]="recurringForm.name" />
            @if (recurringForm.name().touched() && recurringForm.name().errors().length) {
              <span class="field-error">{{ recurringForm.name().errors()[0].message }}</span>
            }
          </label>
          <label class="field">
            Betrag netto (€)
            <input
              type="number"
              inputmode="decimal"
              step="0.01"
              [formField]="recurringForm.amount"
            />
            @if (recurringForm.amount().touched() && recurringForm.amount().errors().length) {
              <span class="field-error">{{ recurringForm.amount().errors()[0].message }}</span>
            }
          </label>
          <label class="field">
            Rhythmus
            <select [formField]="recurringForm.rhythm">
              @for (rhythm of rhythms; track rhythm[0]) {
                <option [value]="rhythm[0]">{{ rhythm[1] }}</option>
              }
            </select>
          </label>
          <label class="field">
            Ab Monat
            <input type="month" placeholder="JJJJ-MM" [formField]="recurringForm.from" />
            @if (recurringForm.from().touched() && recurringForm.from().errors().length) {
              <span class="field-error">{{ recurringForm.from().errors()[0].message }}</span>
            }
          </label>
          @if (!recurringForm.to().hidden()) {
            <label class="field">
              Bis Monat (optional)
              <input type="month" placeholder="JJJJ-MM" [formField]="recurringForm.to" />
              <span class="field-hint">Leer = unbefristet</span>
              @if (recurringForm.to().touched() && recurringForm.to().errors().length) {
                <span class="field-error">{{ recurringForm.to().errors()[0].message }}</span>
              }
            </label>
          }
          <label class="field">
            Kategorie
            <select [formField]="recurringForm.categoryId">
              @for (category of categories; track category.id) {
                <option [value]="category.id">{{ category.name }}</option>
              }
            </select>
          </label>
        </div>
        @if (!recurringForm.provider().hidden()) {
          <fieldset class="stack">
            <legend>Vertragsdetails (optional)</legend>
            <div class="form">
              <label class="field">
                Anbieter
                <input type="text" [formField]="recurringForm.provider" />
              </label>
              <label class="field">
                Kunden-/Vertragsnummer
                <input type="text" [formField]="recurringForm.customerNumber" />
              </label>
              <label class="field">
                Kündigen bis
                <input type="date" [formField]="recurringForm.cancelBy" />
                @if (
                  recurringForm.cancelBy().touched() && recurringForm.cancelBy().errors().length
                ) {
                  <span class="field-error">{{
                    recurringForm.cancelBy().errors()[0].message
                  }}</span>
                }
              </label>
              <label class="field field-check">
                <input type="checkbox" [formField]="recurringForm.monthlyCancelable" />
                Monatlich kündbar
              </label>
            </div>
          </fieldset>
        }
        <div class="form-actions">
          <button type="submit" class="btn">Speichern</button>
          <button type="button" class="btn btn-secondary" (click)="dialog.close()">
            Abbrechen
          </button>
        </div>
      </form>
    </dialog>
  `,
})
export class RecurringForm {
  private readonly store = inject(FinanceStore);
  private readonly clock = inject(Clock);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  private readonly item = signal<RecurringItem | undefined>(undefined);
  private readonly kind = signal<Kind>('income');

  protected readonly categories = CATEGORIES;
  protected readonly rhythms = Object.entries(RHYTHM_LABELS) as [Rhythm, string][];

  protected readonly model = signal(emptyModel('income', ''));
  protected readonly recurringForm = form(this.model, (s) => {
    required(s.name, { message: 'Bitte gib eine Bezeichnung ein.' });
    required(s.amount, { message: 'Bitte gib einen Betrag ein.' });
    min(s.amount, 0.01, { message: 'Der Betrag muss größer als 0 sein.' });
    required(s.from, { message: 'Bitte wähle einen Monat.' });
    pattern(s.from, MONTH_PATTERN, { message: 'Bitte im Format JJJJ-MM eingeben.' });
    pattern(s.to, MONTH_PATTERN, { message: 'Bitte im Format JJJJ-MM eingeben.' });
    hidden(s.to, { when: ({ valueOf }) => valueOf(s.rhythm) === 'once' });
    validate(s.to, ({ value, valueOf }) =>
      value() && value() < valueOf(s.from)
        ? { kind: 'beforeFrom', message: '„Bis“ darf nicht vor „Ab“ liegen.' }
        : undefined,
    );
    hidden(s.provider, { when: ({ valueOf }) => valueOf(s.kind) !== 'expense' });
    pattern(s.cancelBy, DATE_PATTERN, { message: 'Bitte ein gültiges Datum eingeben.' });
  });

  protected readonly title = computed(() => {
    const item = this.item();
    return item
      ? 'Eintrag bearbeiten'
      : this.kind() === 'income'
        ? 'Neue Einnahme'
        : 'Neue fixe Ausgabe';
  });

  /** Opens the dialog to edit `item`, or to create a new entry of `kind`. */
  open(item: RecurringItem | undefined, kind: Kind = 'income'): void {
    this.item.set(item);
    this.kind.set(kind);
    this.recurringForm().reset(
      item
        ? {
            kind: item.kind,
            name: item.name,
            amount: item.amount,
            rhythm: item.rhythm,
            from: item.from,
            to: item.to,
            categoryId: item.categoryId,
            provider: item.provider,
            customerNumber: item.customerNumber,
            cancelBy: item.cancelBy,
            monthlyCancelable: item.monthlyCancelable,
          }
        : emptyModel(this.kind(), this.clock.month()),
    );
    this.dialog().nativeElement.showModal();
  }

  protected save(): void {
    submit(this.recurringForm, async () => {
      const value = this.model();
      const existing = this.item();
      const id = existing?.id ?? newId();
      const kind = value.kind as Kind;
      this.store.save('recurring', {
        id,
        seriesId: existing?.seriesId ?? id,
        kind,
        name: value.name.trim(),
        amount: value.amount,
        rhythm: value.rhythm as Rhythm,
        from: value.from,
        to: value.rhythm === 'once' ? value.from : value.to,
        categoryId: value.categoryId,
        provider: kind === 'expense' ? value.provider.trim() : '',
        customerNumber: kind === 'expense' ? value.customerNumber.trim() : '',
        cancelBy: kind === 'expense' ? value.cancelBy : '',
        monthlyCancelable: kind === 'expense' && value.monthlyCancelable,
        status: existing?.status ?? 'active',
      });
      this.dialog().nativeElement.close();
    });
  }
}
