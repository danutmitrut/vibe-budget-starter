/**
 * API ROUTE - Statistici Dashboard
 *
 * GET /api/reports/stats
 *
 * Returnează rezumatul financiar pentru utilizatorul autentificat:
 * - totalBalance: Soldul total (toate tranzacțiile)
 * - monthlyIncome: Veniturile din luna curentă
 * - monthlyExpenses: Cheltuielile din luna curentă
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
    }

    // Fetch toate tranzacțiile utilizatorului
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('amount, date')
      .eq('user_id', user.id);

    const txns = allTransactions || [];

    // Total balance - suma tuturor tranzacțiilor
    const totalBalance = txns.reduce((sum, t) => sum + Number(t.amount), 0);

    // Luna curentă - date range
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    // Filtrare tranzacții luna curentă
    const monthlyTxns = txns.filter(t => t.date >= monthStart && t.date <= monthEnd);

    // Venituri luna curentă (amount > 0)
    const monthlyIncome = monthlyTxns
      .filter(t => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Cheltuieli luna curentă (amount < 0, returnăm valoare pozitivă)
    const monthlyExpenses = Math.abs(
      monthlyTxns
        .filter(t => Number(t.amount) < 0)
        .reduce((sum, t) => sum + Number(t.amount), 0)
    );

    return NextResponse.json({
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
    });
  } catch (error) {
    console.error('[API/STATS] Error:', error);
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}
