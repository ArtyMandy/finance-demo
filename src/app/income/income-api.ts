import { inject, Service } from '@angular/core';
import { Supabase } from '../core/supabase';

export interface MonthlyIncome {
  id: number;
  /** First day of the month, e.g. 2026-10-01 */
  month: string;
  amount: number;
}

@Service()
export class IncomeApi {
  private readonly supabase = inject(Supabase).client;

  async list(): Promise<MonthlyIncome[]> {
    const { data, error } = await this.supabase
      .from('monthly_income')
      .select('id, month, amount')
      .order('month', { ascending: false });
    if (error) throw error;
    return data;
  }

  /** Creates or replaces the income for a month given as YYYY-MM. */
  async save(month: string, amount: number): Promise<void> {
    const { error } = await this.supabase
      .from('monthly_income')
      .upsert({ month: `${month}-01`, amount }, { onConflict: 'user_id,month' });
    if (error) throw error;
  }

  async remove(id: number): Promise<void> {
    const { error } = await this.supabase.from('monthly_income').delete().eq('id', id);
    if (error) throw error;
  }
}
