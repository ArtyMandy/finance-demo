import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, FormField, min, pattern, required, submit, validate } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { Clock } from '../core/clock';
import { liquidReserve } from '../data/analytics';
import { FinanceStore, newId } from '../data/finance-store';
import { Goal } from '../data/models';
import { monthIndex, MONTH_PATTERN } from '../data/months';
import { fixedCostsPerMonth } from '../data/recurring';
import { RULES } from '../rules/rules';
import { formatEuroRounded, formatMonth } from '../shared/format';

/** Monthly amount needed to reach the goal by its target month (at least one month left). */
export function monthlyRate(goal: Goal, currentMonth: string): number {
  const months = Math.max(1, monthIndex(goal.targetMonth) - monthIndex(currentMonth) + 1);
  return Math.max(0, goal.target - goal.saved) / months;
}

type Tab = 'active' | 'done';

@Component({
  imports: [FormField, RouterLink],
  selector: 'app-goals',
  templateUrl: './goals.html',
  styles: `
    .goal-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .pct {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 600;
    }
    .check {
      flex-direction: row;
      align-items: flex-start;
    }
  `,
})
export class Goals {
  private readonly store = inject(FinanceStore);
  private readonly clock = inject(Clock);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('goalDialog');
  private readonly depositDialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('depositDialog');

  protected readonly tab = signal<Tab>('active');
  protected readonly editing = signal<Goal | undefined>(undefined);
  protected readonly depositGoal = signal<Goal | undefined>(undefined);

  private readonly goals = computed(() => this.store.data().goals);
  protected readonly active = computed(() => this.goals().filter((goal) => !goal.achievedMonth));
  protected readonly done = computed(() => this.goals().filter((goal) => goal.achievedMonth));
  protected readonly totalSaved = computed(() =>
    this.goals().reduce((sum, goal) => sum + goal.saved, 0),
  );

  protected readonly cards = computed(() =>
    this.active().map((goal) => {
      const percent =
        goal.target > 0 ? Math.min(100, Math.round((goal.saved / goal.target) * 100)) : 0;
      return {
        goal,
        percent,
        rate: monthlyRate(goal, this.clock.month()),
        overdue: goal.targetMonth < this.clock.month(),
      };
    }),
  );

  protected readonly emergency = computed(() => {
    const data = this.store.data();
    const fixed = fixedCostsPerMonth(data.recurring, this.clock.month());
    const reserve = liquidReserve(data);
    const low = fixed * RULES.emergencyFund.minMonths;
    const high = fixed * RULES.emergencyFund.maxMonths;
    const status = !fixed
      ? 'unknown'
      : reserve < low
        ? 'below'
        : reserve > high
          ? 'above'
          : 'inside';
    return { fixed, reserve, low, high, status };
  });

  protected readonly eur = formatEuroRounded;
  protected readonly month = formatMonth;

  protected readonly model = signal({ name: '', target: 0, targetMonth: '', saved: 0 });
  protected readonly goalForm = form(this.model, (s) => {
    required(s.name, { message: 'Bitte gib dem Ziel einen Namen.' });
    required(s.target, { message: 'Bitte gib einen Zielbetrag ein.' });
    min(s.target, 1, { message: 'Der Zielbetrag muss größer als 0 sein.' });
    required(s.targetMonth, { message: 'Bitte wähle einen Zielmonat.' });
    pattern(s.targetMonth, MONTH_PATTERN, { message: 'Bitte im Format JJJJ-MM eingeben.' });
    min(s.saved, 0, { message: 'Der Betrag darf nicht negativ sein.' });
  });

  protected readonly depositModel = signal({ amount: 0, withdraw: false });
  protected readonly depositForm = form(this.depositModel, (s) => {
    required(s.amount, { message: 'Bitte gib einen Betrag ein.' });
    min(s.amount, 0.01, { message: 'Der Betrag muss größer als 0 sein.' });
    validate(s.amount, ({ value, valueOf }) => {
      const goal = this.depositGoal();
      if (goal && valueOf(s.withdraw) && value() > goal.saved) {
        return {
          kind: 'tooMuch',
          message: `Es sind nur ${formatEuroRounded(goal.saved)} gespart.`,
        };
      }
      return undefined;
    });
  });

  protected openGoal(goal?: Goal): void {
    this.editing.set(goal);
    this.goalForm().reset(
      goal
        ? { name: goal.name, target: goal.target, targetMonth: goal.targetMonth, saved: goal.saved }
        : { name: '', target: 0, targetMonth: '', saved: 0 },
    );
    this.dialog().nativeElement.showModal();
  }

  protected saveGoal(): void {
    submit(this.goalForm, async () => {
      const value = this.model();
      const existing = this.editing();
      const goal: Goal = {
        id: existing?.id ?? newId(),
        name: value.name.trim(),
        target: value.target,
        targetMonth: value.targetMonth,
        saved: value.saved,
        achievedMonth:
          value.saved >= value.target ? existing?.achievedMonth || this.clock.month() : '',
      };
      this.store.save('goals', goal);
      this.dialog().nativeElement.close();
    });
  }

  protected openDeposit(goal: Goal, withdraw = false): void {
    this.depositGoal.set(goal);
    this.depositForm().reset({ amount: 0, withdraw });
    this.depositDialog().nativeElement.showModal();
  }

  protected saveDeposit(): void {
    submit(this.depositForm, async () => {
      const goal = this.depositGoal();
      if (!goal) return;
      const { amount, withdraw } = this.depositModel();
      this.store.deposit(goal, withdraw ? -amount : amount);
      this.depositDialog().nativeElement.close();
    });
  }

  protected remove(goal: Goal): void {
    this.store.remove('goals', goal.id);
  }
}
