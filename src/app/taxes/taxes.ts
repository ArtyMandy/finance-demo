import { Component } from '@angular/core';
import { RULES } from '../rules/rules';
import { formatDate } from '../shared/format';
import { CapitalTaxCalculator } from './capital-tax-calculator';
import { ExemptionOrders } from './exemption-orders';
import { SubsidyCalculators } from './subsidy-calculators';

@Component({
  imports: [CapitalTaxCalculator, ExemptionOrders, SubsidyCalculators],
  selector: 'app-taxes',
  template: `
    <main id="inhalt" class="page">
      <div class="page-head">
        <div>
          <span class="eyebrow">Regeln mit Stand {{ asOf }}</span>
          <h1>Steuer-Helfer</h1>
        </div>
      </div>
      <app-exemption-orders />
      <div class="grid">
        <app-capital-tax-calculator class="stack" />
        <app-subsidy-calculators class="stack" />
      </div>
      <p class="disclaimer">
        Vereinfachte Berechnungen zur Orientierung, keine Steuerberatung. Werte werden jährlich
        geprüft.
      </p>
    </main>
  `,
})
export class Taxes {
  protected readonly asOf = formatDate(RULES.asOf);
}
