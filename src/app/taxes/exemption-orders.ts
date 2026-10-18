import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, FormField, min, required, submit } from '@angular/forms/signals';
import { FinanceStore, newId } from '../data/finance-store';
import { ExemptionOrder } from '../data/models';
import { distributeExemption, sparerPauschbetrag } from '../rules/rules';
import { formatEuroRounded } from '../shared/format';

/** Freistellungsaufträge across all banks, checked against the Sparerpauschbetrag. */
@Component({
  imports: [FormField],
  selector: 'app-exemption-orders',
  template: `
    <section class="card" aria-labelledby="fsa-heading">
      <div class="spread">
        <h2 id="fsa-heading">Freistellungsaufträge</h2>
        <button type="button" class="btn btn-small" (click)="open()">Auftrag hinzufügen</button>
      </div>
      <p class="meta">
        Sparerpauschbetrag {{ eur(limit()) }} ({{
          joint() ? 'Zusammenveranlagung' : 'Einzelperson'
        }}, änderbar unter Profil). Nur mit Freistellungsauftrag zieht die Bank bis zu diesem Betrag
        keine Steuer ab; die Summe aller Aufträge darf den Pauschbetrag nicht überschreiten.
      </p>
      <div class="bar" aria-hidden="true">
        @for (order of bars(); track order.id) {
          <span
            [class.bar-dark]="$even"
            [class.bar-over]="over()"
            [style.width.%]="order.percent"
          ></span>
        }
      </div>
      <p [class.negative]="over()" [class.savings-text]="!over() && free() > 0" role="status">
        @if (over()) {
          ⚠ Die Aufträge übersteigen den Pauschbetrag um {{ eur(total() - limit()) }}. Bitte
          reduzieren.
        } @else {
          Erteilt: {{ eur(total()) }} · noch frei: <strong>{{ eur(free()) }}</strong>
        }
      </p>
      @if (orders().length) {
        <div class="table-wrap">
          <table>
            <caption class="visually-hidden">
              Freistellungsaufträge je Bank
            </caption>
            <thead>
              <tr>
                <th scope="col">Bank</th>
                <th scope="col" class="amount">Auftrag</th>
                <th scope="col" class="amount">Erwartete Erträge</th>
                @if (proposal().length) {
                  <th scope="col" class="amount">Vorschlag</th>
                }
                <th scope="col"><span class="visually-hidden">Aktionen</span></th>
              </tr>
            </thead>
            <tbody>
              @for (order of orders(); track order.id; let i = $index) {
                <tr>
                  <th scope="row">{{ order.institution }}</th>
                  <td class="amount">{{ eur(order.amount) }}</td>
                  <td class="amount">{{ eur(order.expectedIncome) }}</td>
                  @if (proposal().length) {
                    <td class="amount">
                      <strong>{{ eur(proposal()[i]) }}</strong>
                    </td>
                  }
                  <td>
                    <button type="button" class="btn btn-ghost btn-small" (click)="open(order)">
                      Bearbeiten<span class="visually-hidden">: {{ order.institution }}</span>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="row">
          @if (proposal().length) {
            <button type="button" class="btn" (click)="applyProposal()">
              Vorschlag übernehmen
            </button>
            <button type="button" class="btn btn-secondary" (click)="proposal.set([])">
              Verwerfen
            </button>
          } @else {
            <button
              type="button"
              class="btn btn-secondary"
              [disabled]="!hasExpected()"
              (click)="propose()"
            >
              Verteilung nach erwarteten Erträgen vorschlagen
            </button>
          }
        </div>
        @if (proposal().length) {
          <p class="meta">
            Neue Aufträge erteilst du bei den Banken selbst (meist online im Banking). Die App merkt
            sich nur die Beträge.
          </p>
        }
      } @else {
        <p class="empty">Noch keine Freistellungsaufträge erfasst.</p>
      }
    </section>

    <dialog #dialog aria-labelledby="fsa-title">
      <form class="dialog-body" novalidate (submit)="save(); $event.preventDefault()">
        <h2 id="fsa-title">
          {{ editing() ? 'Freistellungsauftrag bearbeiten' : 'Freistellungsauftrag hinzufügen' }}
        </h2>
        <div class="form">
          <label class="field">
            Bank / Broker
            <input type="text" [formField]="orderForm.institution" />
            @if (orderForm.institution().touched() && orderForm.institution().errors().length) {
              <span class="field-error">{{ orderForm.institution().errors()[0].message }}</span>
            }
          </label>
          <label class="field">
            Erteilter Betrag (€)
            <input type="number" inputmode="decimal" step="1" [formField]="orderForm.amount" />
            @if (orderForm.amount().touched() && orderForm.amount().errors().length) {
              <span class="field-error">{{ orderForm.amount().errors()[0].message }}</span>
            }
          </label>
          <label class="field">
            Erwartete Kapitalerträge dieses Jahr (€)
            <input
              type="number"
              inputmode="decimal"
              step="1"
              [formField]="orderForm.expectedIncome"
            />
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn">Speichern</button>
          <button type="button" class="btn btn-secondary" (click)="dialog.close()">
            Abbrechen
          </button>
          @if (editing(); as order) {
            <button type="button" class="btn btn-danger" (click)="remove(order)">Löschen</button>
          }
        </div>
      </form>
    </dialog>
  `,
})
export class ExemptionOrders {
  private readonly store = inject(FinanceStore);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly eur = formatEuroRounded;
  protected readonly orders = computed(() => this.store.data().exemptionOrders);
  protected readonly joint = computed(() => this.store.data().profile.jointAssessment);
  protected readonly limit = computed(() => sparerPauschbetrag(this.joint()));
  protected readonly total = computed(() => this.orders().reduce((sum, o) => sum + o.amount, 0));
  protected readonly free = computed(() => Math.max(0, this.limit() - this.total()));
  protected readonly over = computed(() => this.total() > this.limit());
  protected readonly bars = computed(() =>
    this.orders().map((o) => ({
      id: o.id,
      percent: (o.amount / Math.max(this.limit(), this.total())) * 100,
    })),
  );
  protected readonly hasExpected = computed(() => this.orders().some((o) => o.expectedIncome > 0));
  protected readonly proposal = signal<number[]>([]);

  protected readonly editing = signal<ExemptionOrder | undefined>(undefined);
  protected readonly model = signal({ institution: '', amount: 0, expectedIncome: 0 });
  protected readonly orderForm = form(this.model, (s) => {
    required(s.institution, { message: 'Bitte gib die Bank an.' });
    min(s.amount, 0, { message: 'Der Betrag darf nicht negativ sein.' });
    min(s.expectedIncome, 0);
  });

  protected open(order?: ExemptionOrder): void {
    this.editing.set(order);
    this.orderForm().reset(
      order ? { ...order } : { institution: '', amount: 0, expectedIncome: 0 },
    );
    this.dialog().nativeElement.showModal();
  }

  protected save(): void {
    submit(this.orderForm, async () => {
      this.store.save('exemptionOrders', {
        id: this.editing()?.id ?? newId(),
        ...this.model(),
        institution: this.model().institution.trim(),
      });
      this.proposal.set([]);
      this.dialog().nativeElement.close();
    });
  }

  protected remove(order: ExemptionOrder): void {
    this.store.remove('exemptionOrders', order.id);
    this.proposal.set([]);
    this.dialog().nativeElement.close();
  }

  protected propose(): void {
    this.proposal.set(
      distributeExemption(
        this.orders().map((o) => o.expectedIncome),
        this.limit(),
      ),
    );
  }

  protected applyProposal(): void {
    const proposal = this.proposal();
    this.orders().forEach((order, index) =>
      this.store.save('exemptionOrders', { ...order, amount: proposal[index] }),
    );
    this.proposal.set([]);
  }
}
