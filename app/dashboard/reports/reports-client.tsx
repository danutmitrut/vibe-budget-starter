'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { startOfMonth, subMonths, format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface Category {
  id: string;
  name: string;
  icon: string;
  type: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  category_id: string | null;
  categories: Category | null;
}

const CHART_COLORS = [
  '#0d9488', '#f97316', '#8b5cf6', '#ec4899', '#eab308', '#22c55e',
  '#3b82f6', '#ef4444', '#06b6d4', '#a855f7', '#14b8a6', '#f59e0b',
];

interface AiAnalysis {
  healthScore: number;
  healthLabel: string;
  tips: string[];
  positive: string;
  summary: string;
}

type PeriodFilter = 'current_month' | 'last_3_months' | 'last_6_months' | 'all';

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'current_month', label: 'Luna curentă' },
  { value: 'last_3_months', label: 'Ultimele 3 luni' },
  { value: 'last_6_months', label: 'Ultimele 6 luni' },
  { value: 'all', label: 'Tot' },
];

export default function ReportsClient() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('last_3_months');
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch('/api/transactions');
        if (!res.ok) throw new Error('Eroare');
        const data = await res.json();
        setTransactions(data.transactions);
      } catch {
        toast.error('Eroare la încărcarea datelor');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Filtrare pe perioadă
  const filteredTransactions = useMemo(() => {
    if (period === 'all') return transactions;

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'current_month':
        startDate = startOfMonth(now);
        break;
      case 'last_3_months':
        startDate = startOfMonth(subMonths(now, 2));
        break;
      case 'last_6_months':
        startDate = startOfMonth(subMonths(now, 5));
        break;
      default:
        return transactions;
    }

    const startStr = format(startDate, 'yyyy-MM-dd');
    return transactions.filter(t => t.date >= startStr);
  }, [transactions, period]);

  // Rezumat financiar (3 carduri)
  const summary = useMemo(() => {
    let totalExpenses = 0;
    let totalIncome = 0;

    for (const t of filteredTransactions) {
      const amount = Number(t.amount);
      if (amount < 0) {
        totalExpenses += Math.abs(amount);
      } else {
        totalIncome += amount;
      }
    }

    return {
      expenses: Number(totalExpenses.toFixed(2)),
      income: Number(totalIncome.toFixed(2)),
      balance: Number((totalIncome - totalExpenses).toFixed(2)),
    };
  }, [filteredTransactions]);

  // Cheltuieli pe categorii (pie chart)
  const expensesByCategory = useMemo(() => {
    const expenses = filteredTransactions.filter(t => Number(t.amount) < 0);
    const categoryMap = new Map<string, { name: string; icon: string; total: number }>();

    for (const t of expenses) {
      const catName = t.categories?.name || 'Necategorizat';
      const catIcon = t.categories?.icon || '❓';
      const existing = categoryMap.get(catName);
      if (existing) {
        existing.total += Math.abs(Number(t.amount));
      } else {
        categoryMap.set(catName, { name: catName, icon: catIcon, total: Math.abs(Number(t.amount)) });
      }
    }

    return Array.from(categoryMap.values())
      .sort((a, b) => b.total - a.total)
      .map(item => ({
        name: `${item.icon} ${item.name}`,
        value: Number(item.total.toFixed(2)),
      }));
  }, [filteredTransactions]);

  // Cheltuieli pe luni (bar chart)
  const expensesByMonth = useMemo(() => {
    const expenses = filteredTransactions.filter(t => Number(t.amount) < 0);
    const monthMap = new Map<string, number>();

    for (const t of expenses) {
      const monthKey = t.date.substring(0, 7);
      const existing = monthMap.get(monthKey) || 0;
      monthMap.set(monthKey, existing + Math.abs(Number(t.amount)));
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => {
        const [year, m] = month.split('-');
        const date = new Date(Number(year), Number(m) - 1);
        return {
          name: format(date, 'MMM yyyy', { locale: ro }),
          total: Number(total.toFixed(2)),
        };
      });
  }, [filteredTransactions]);

  // Tabel pivot real: categorii x luni (ca în aplicația integrală)
  const [showPercentages, setShowPercentages] = useState(false);

  interface PivotCell {
    amount: number;
    count: number;
    change?: number;
  }

  interface PivotRow {
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    months: Record<string, PivotCell>;
    total: number;
    average: number;
    maxIncrease: { month: string; change: number };
    maxDecrease: { month: string; change: number };
  }

  const pivotMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    for (const t of filteredTransactions) {
      if (Number(t.amount) < 0) {
        monthsSet.add(t.date.substring(0, 7));
      }
    }
    return Array.from(monthsSet).sort();
  }, [filteredTransactions]);

  const pivotRows = useMemo((): PivotRow[] => {
    // Doar cheltuieli (amount < 0)
    const expenses = filteredTransactions.filter(t => Number(t.amount) < 0);

    // Grupare pe categorie + lună
    const catMap = new Map<string, { name: string; icon: string; months: Map<string, { amount: number; count: number }> }>();

    for (const t of expenses) {
      const catId = t.category_id || '__uncategorized';
      const catName = t.categories?.name || 'Necategorizat';
      const catIcon = t.categories?.icon || '❓';
      const monthKey = t.date.substring(0, 7);
      const absAmount = Math.abs(Number(t.amount));

      if (!catMap.has(catId)) {
        catMap.set(catId, { name: catName, icon: catIcon, months: new Map() });
      }
      const cat = catMap.get(catId)!;
      const existing = cat.months.get(monthKey) || { amount: 0, count: 0 };
      existing.amount += absAmount;
      existing.count++;
      cat.months.set(monthKey, existing);
    }

    // Construim rândurile pivot
    const rows: PivotRow[] = [];

    catMap.forEach((catData, catId) => {
      const months: Record<string, PivotCell> = {};
      let total = 0;

      // Inițializăm toate lunile
      for (const m of pivotMonths) {
        const cell = catData.months.get(m) || { amount: 0, count: 0 };
        months[m] = { amount: cell.amount, count: cell.count };
        total += cell.amount;
      }

      const average = pivotMonths.length > 0 ? total / pivotMonths.length : 0;

      // Calculăm schimbări procentuale între luni consecutive
      let prevAmount: number | null = null;
      let maxIncrease = { month: '', change: 0 };
      let maxDecrease = { month: '', change: 0 };

      for (const m of pivotMonths) {
        const currentAmount = months[m].amount;
        if (prevAmount !== null && prevAmount > 0) {
          const change = ((currentAmount - prevAmount) / prevAmount) * 100;
          months[m].change = change;
          if (change > maxIncrease.change) maxIncrease = { month: m, change };
          if (change < maxDecrease.change) maxDecrease = { month: m, change };
        }
        prevAmount = currentAmount;
      }

      rows.push({
        categoryId: catId,
        categoryName: catData.name,
        categoryIcon: catData.icon,
        months,
        total,
        average,
        maxIncrease,
        maxDecrease,
      });
    });

    // Sortare descrescătoare după total
    return rows.sort((a, b) => b.total - a.total);
  }, [filteredTransactions, pivotMonths]);

  // Funcții de colorare celule (bazate pe raportul cu media categoriei)
  const getCellColor = (amount: number, average: number): string => {
    if (amount === 0) return 'bg-gray-50 text-gray-400';
    const ratio = amount / average;
    if (ratio >= 1.5) return 'bg-red-100 text-red-900 font-bold';
    if (ratio >= 1.2) return 'bg-orange-100 text-orange-900 font-semibold';
    if (ratio >= 0.8) return 'bg-yellow-50 text-yellow-900';
    return 'bg-green-100 text-green-900';
  };

  const getChangeColor = (change: number): string => {
    if (change >= 50) return 'text-red-700 font-bold';
    if (change >= 20) return 'text-orange-700 font-semibold';
    if (change >= 0) return 'text-yellow-700';
    if (change >= -20) return 'text-green-700';
    if (change >= -50) return 'text-green-800 font-semibold';
    return 'text-green-900 font-bold';
  };

  const formatPivotMonth = (month: string): string => {
    const [year, m] = month.split('-');
    const monthNames = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];
    return `${monthNames[parseInt(m, 10) - 1]} ${year}`;
  };

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);

    try {
      const res = await fetch('/api/reports/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expensesByCategory,
          expensesByMonth,
          totalExpenses: summary.expenses,
          totalIncome: summary.income,
          balance: summary.balance,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Eroare la analiza AI');
        return;
      }

      setAiAnalysis(data.analysis);
    } catch {
      toast.error('Eroare de conexiune la server');
    } finally {
      setAiLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-teal-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-teal-100';
    if (score >= 40) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rapoarte</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            ← Înapoi la Dashboard
          </Link>
        </div>

        {/* Filtru perioadă */}
        <div className="flex flex-wrap gap-2 mb-8">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                period === opt.value
                  ? 'bg-teal-500 text-white'
                  : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Rezumat financiar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg text-center">
            <p className="text-gray-500 text-sm font-medium mb-2">Total Cheltuieli</p>
            <p className="text-3xl font-bold text-red-600">
              -{summary.expenses.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} <span className="text-lg font-normal text-gray-400">RON</span>
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg text-center">
            <p className="text-gray-500 text-sm font-medium mb-2">Total Venituri</p>
            <p className="text-3xl font-bold text-green-600">
              +{summary.income.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} <span className="text-lg font-normal text-gray-400">RON</span>
            </p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg text-center">
            <p className="text-gray-500 text-sm font-medium mb-2">Balanță</p>
            <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.balance >= 0 ? '+' : ''}{summary.balance.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} <span className="text-lg font-normal text-gray-400">RON</span>
            </p>
          </div>
        </div>

        {/* Pie Chart - Cheltuieli pe categorii */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cheltuieli pe categorii</h2>
          {expensesByCategory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nicio cheltuială în perioada selectată</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="value"
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={((props: any) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`) as any}
                >
                  {expensesByCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} RON`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart - Cheltuieli pe luni */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Cheltuieli pe luni</h2>
          {expensesByMonth.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nicio cheltuială în perioada selectată</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={expensesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} RON`} />
                <Bar dataKey="total" name="Cheltuieli" fill="#0d9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tabel Pivot Real - Categorii x Luni */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Raport Pivot - Categorii x Luni</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPercentages}
                onChange={(e) => setShowPercentages(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-600">Arată % față de luna anterioară</span>
            </label>
          </div>

          {/* Legendă culori */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-3 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-gray-600">Critic (&gt;150%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-3 bg-orange-100 border border-orange-300 rounded"></div>
              <span className="text-gray-600">Ridicat (120-150%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-3 bg-yellow-50 border border-yellow-300 rounded"></div>
              <span className="text-gray-600">Normal (80-120%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-gray-600">Sub medie (&lt;80%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-3 bg-gray-50 border border-gray-300 rounded"></div>
              <span className="text-gray-600">Fără cheltuieli</span>
            </div>
          </div>

          {pivotRows.length === 0 || pivotMonths.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nicio cheltuială în perioada selectată</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="sticky left-0 bg-gray-100 px-4 py-3 text-left font-bold border-r-2 border-gray-300 z-10 min-w-[160px]">
                      Categorie
                    </th>
                    {pivotMonths.map(month => (
                      <th key={month} className="px-3 py-3 text-center font-semibold border-r border-gray-200 min-w-[100px]">
                        {formatPivotMonth(month)}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center font-bold border-l-2 border-gray-300 bg-indigo-50 min-w-[100px]">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center font-bold bg-indigo-50 min-w-[100px]">
                      Medie/lună
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pivotRows.map(row => (
                    <tr key={row.categoryId} className="border-b hover:bg-gray-50/50">
                      <td className="sticky left-0 bg-white px-4 py-3 font-semibold border-r-2 border-gray-300 z-10">
                        <div className="flex items-center gap-2">
                          <span>{row.categoryIcon}</span>
                          <span className="truncate">{row.categoryName}</span>
                        </div>
                      </td>
                      {pivotMonths.map(month => {
                        const cell = row.months[month];
                        const colorClass = getCellColor(cell.amount, row.average);
                        return (
                          <td key={month} className={`px-3 py-3 text-center border-r border-gray-200 ${colorClass}`}>
                            <div className="font-semibold">
                              {cell.amount > 0
                                ? `${cell.amount.toLocaleString('ro-RO', { maximumFractionDigits: 0 })}`
                                : '-'}
                            </div>
                            {showPercentages && cell.change !== undefined && (
                              <div className={`text-xs mt-0.5 ${getChangeColor(cell.change)}`}>
                                {cell.change > 0 ? '+' : ''}{cell.change.toFixed(0)}%
                              </div>
                            )}
                            {cell.count > 0 && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                {cell.count} tx
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-bold border-l-2 border-gray-300 bg-indigo-50">
                        {row.total.toLocaleString('ro-RO', { maximumFractionDigits: 0 })} RON
                      </td>
                      <td className="px-4 py-3 text-center font-semibold bg-indigo-50">
                        {row.average.toLocaleString('ro-RO', { maximumFractionDigits: 0 })} RON
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Carduri analiză: Top Creșteri / Top Scăderi */}
        {pivotRows.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            {/* Top Creșteri */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <h2 className="text-base font-bold text-gray-900 mb-3">Top Creșteri Lunare</h2>
              <div className="space-y-2">
                {pivotRows
                  .filter(row => row.maxIncrease.change > 0)
                  .sort((a, b) => b.maxIncrease.change - a.maxIncrease.change)
                  .slice(0, 5)
                  .map(row => (
                    <div key={row.categoryId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{row.categoryIcon}</span>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{row.categoryName}</div>
                          <div className="text-xs text-gray-500">{formatPivotMonth(row.maxIncrease.month)}</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-red-700">+{row.maxIncrease.change.toFixed(0)}%</div>
                    </div>
                  ))
                }
                {pivotRows.filter(r => r.maxIncrease.change > 0).length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-2">Nicio creștere semnificativă</p>
                )}
              </div>
            </div>

            {/* Top Scăderi */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <h2 className="text-base font-bold text-gray-900 mb-3">Top Scăderi Lunare</h2>
              <div className="space-y-2">
                {pivotRows
                  .filter(row => row.maxDecrease.change < 0)
                  .sort((a, b) => a.maxDecrease.change - b.maxDecrease.change)
                  .slice(0, 5)
                  .map(row => (
                    <div key={row.categoryId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{row.categoryIcon}</span>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{row.categoryName}</div>
                          <div className="text-xs text-gray-500">{formatPivotMonth(row.maxDecrease.month)}</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-green-700">{row.maxDecrease.change.toFixed(0)}%</div>
                    </div>
                  ))
                }
                {pivotRows.filter(r => r.maxDecrease.change < 0).length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-2">Nicio scădere semnificativă</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Financial Coach */}
        <div className="mt-6">
          {!aiAnalysis && (
            <button
              onClick={handleAiAnalysis}
              disabled={aiLoading || filteredTransactions.length === 0}
              className={`w-full px-6 py-4 rounded-2xl font-medium text-lg transition-colors ${
                aiLoading || filteredTransactions.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg'
              }`}
            >
              {aiLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                  Se analizează cheltuielile...
                </span>
              ) : (
                'Analizează cheltuielile cu AI'
              )}
            </button>
          )}

          {aiAnalysis && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">AI Financial Coach</h2>
                <button
                  onClick={handleAiAnalysis}
                  disabled={aiLoading}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  {aiLoading ? 'Se analizează...' : 'Reanalizează'}
                </button>
              </div>

              {/* Health Score */}
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-2xl ${getScoreBg(aiAnalysis.healthScore)} flex items-center justify-center`}>
                  <span className={`text-3xl font-bold ${getScoreColor(aiAnalysis.healthScore)}`}>
                    {aiAnalysis.healthScore}
                  </span>
                </div>
                <div>
                  <p className={`text-xl font-bold ${getScoreColor(aiAnalysis.healthScore)}`}>
                    {aiAnalysis.healthLabel}
                  </p>
                  <p className="text-gray-600 text-sm">{aiAnalysis.summary}</p>
                </div>
              </div>

              {/* Observație pozitivă */}
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-green-800 font-medium text-sm">Ce faci bine:</p>
                <p className="text-green-700 mt-1">{aiAnalysis.positive}</p>
              </div>

              {/* Sfaturi */}
              <div>
                <p className="font-medium text-gray-900 mb-3">Sfaturi personalizate:</p>
                <ul className="space-y-2">
                  {aiAnalysis.tips.map((tip, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <span className="text-teal-500 font-bold mt-0.5">{i + 1}.</span>
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
