import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, FormField, min, pattern, required, submit } from '@angular/forms/signals';
import { Clock } from '../core/clock';
import { FinanceStore, newId } from '../data/finance-store';
import { ASSET_TYPE_LABELS, AssetType, Holding } from '../data/models';
import { DATE_PATTERN } from '../data/months';
import { formatDateShort, formatEuro, formatSignedPercent } from '../shared/format';

/** Depot positions with savings plans and dividends. */
@Component({
  imports: [FormField],
  selector: 'app-holdings',
  templateUrl: './holdings.html',
})
export class Holdings {
  private readonly store = inject(FinanceStore);
  private readonly clock = inject(Clock);
  private readonly holdingDialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('holdingDialog');
  private readonly dividendDialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dividendDialog');

  protected readonly eur = formatEuro;
  protected readonly pct = formatSignedPercent;
  protected readonly date = formatDateShort;
  protected readonly assetTypes = Object.entries(ASSET_TYPE_LABELS) as [AssetType, string][];
  protected readonly assetLabel = (type: AssetType) => ASSET_TYPE_LABELS[type];

  protected readonly depots = computed(() =>
    this.store.data().accounts.filter((a) => a.type === 'depot'),
  );
  protected readonly rows = computed(() =>
    this.store.data().holdings.map((holding) => {
      const value = holding.quantity * holding.currentPrice;
      const cost = holding.quantity * holding.buyPrice;
      return { holding, value, gain: value - cost, gainPct: cost ? (value - cost) / cost : 0 };
    }),
  );
  private readonly holdingNames = computed(
    () => new Map(this.store.data().holdings.map((h) => [h.id, h.name])),
  );
  protected readonly holdingName = (id: string) =>
    this.holdingNames().get(id) ?? 'Gelöschte Position';
  protected readonly dividends = computed(() =>
    this.store
      .data()
      .dividends.filter((d) => d.date.startsWith(String(this.clock.year())))
      .sort((a, b) => b.date.localeCompare(a.date)),
  );
  protected readonly dividendTotal = computed(() =>
    this.dividends().reduce((sum, d) => sum + d.amount, 0),
  );

  protected readonly editing = signal<Holding | undefined>(undefined);
  protected readonly model = signal({
    accountId: '',
    name: '',
    isin: '',
    assetType: 'etf' as string,
    quantity: 0,
    buyPrice: 0,
    currentPrice: 0,
    savingsPlan: 0,
  });
  protected readonly holdingForm = form(this.model, (s) => {
    required(s.accountId, { message: 'Bitte wähle ein Depot.' });
    required(s.name, { message: 'Bitte gib einen Namen ein.' });
    pattern(s.isin, /^([A-Z]{2}[A-Z0-9]{9}\d)?$/, {
      message: 'Eine ISIN hat 12 Zeichen, z. B. IE00B4L5Y983.',
    });
    min(s.quantity, 0, { message: 'Die Stückzahl darf nicht negativ sein.' });
    min(s.buyPrice, 0, { message: 'Der Preis darf nicht negativ sein.' });
    min(s.currentPrice, 0, { message: 'Der Preis darf nicht negativ sein.' });
    min(s.savingsPlan, 0, { message: 'Die Rate darf nicht negativ sein.' });
  });

  protected readonly dividendModel = signal({ holdingId: '', date: '', amount: 0 });
  protected readonly dividendForm = form(this.dividendModel, (s) => {
    required(s.holdingId, { message: 'Bitte wähle eine Position.' });
    required(s.date, { message: 'Bitte gib ein Datum ein.' });
    pattern(s.date, DATE_PATTERN, { message: 'Bitte ein gültiges Datum eingeben.' });
    min(s.amount, 0.01, { message: 'Der Betrag muss größer als 0 sein.' });
  });

  protected openHolding(holding?: Holding): void {
    this.editing.set(holding);
    this.holdingForm().reset(
      holding
        ? { ...holding, assetType: holding.assetType }
        : {
            accountId: this.depots()[0]?.id ?? '',
            name: '',
            isin: '',
            assetType: 'etf',
            quantity: 0,
            buyPrice: 0,
            currentPrice: 0,
            savingsPlan: 0,
          },
    );
    this.holdingDialog().nativeElement.showModal();
  }

  protected saveHolding(): void {
    submit(this.holdingForm, async () => {
      const value = this.model();
      this.store.saveHolding({
        ...value,
        id: this.editing()?.id ?? newId(),
        name: value.name.trim(),
        isin: value.isin.trim().toUpperCase(),
        assetType: value.assetType as AssetType,
      });
      this.holdingDialog().nativeElement.close();
    });
  }

  protected removeHolding(): void {
    const holding = this.editing();
    if (holding) this.store.removeHolding(holding);
    this.holdingDialog().nativeElement.close();
  }

  protected openDividend(): void {
    this.dividendForm().reset({
      holdingId: this.store.data().holdings[0]?.id ?? '',
      date: this.clock.today(),
      amount: 0,
    });
    this.dividendDialog().nativeElement.showModal();
  }

  protected saveDividend(): void {
    submit(this.dividendForm, async () => {
      this.store.save('dividends', { id: newId(), ...this.dividendModel() });
      this.dividendDialog().nativeElement.close();
    });
  }

  protected removeDividend(id: string): void {
    this.store.remove('dividends', id);
  }
}
