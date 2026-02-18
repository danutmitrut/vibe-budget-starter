'use client';

/**
 * DASHBOARD CLIENT COMPONENT
 *
 * Afișează rezumatul financiar și butonul de logout.
 * Fetch-uiește statisticile de la API (/api/reports/stats).
 *
 * Carduri:
 * 1. Sold Total - suma tuturor tranzacțiilor
 * 2. Venituri Luna Aceasta - tranzacții pozitive luna curentă
 * 3. Cheltuieli Luna Aceasta - tranzacții negative luna curentă
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

type Stats = {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
};

type DashboardClientProps = {
  userEmail: string;
  profileName: string;
};

export default function DashboardClient({ userEmail, profileName }: DashboardClientProps) {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/reports/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('[DASHBOARD] Error fetching stats:', error);
      toast.error('Eroare la încărcarea statisticilor');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const formatAmount = (amount: number) => {
    return amount.toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bine ai venit, {profileName}!
            </h1>
            <p className="text-gray-600 mt-1">{userEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors text-sm"
          >
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sold Total */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <p className="text-gray-500 text-sm font-medium mb-2">Sold Total</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatAmount(stats?.totalBalance ?? 0)} <span className="text-lg font-normal text-gray-500">RON</span>
              </p>
            </div>

            {/* Venituri Luna Aceasta */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <p className="text-gray-500 text-sm font-medium mb-2">Venituri Luna Aceasta</p>
              <p className="text-3xl font-bold text-green-600">
                +{formatAmount(stats?.monthlyIncome ?? 0)} <span className="text-lg font-normal text-gray-400">RON</span>
              </p>
            </div>

            {/* Cheltuieli Luna Aceasta */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <p className="text-gray-500 text-sm font-medium mb-2">Cheltuieli Luna Aceasta</p>
              <p className="text-3xl font-bold text-red-600">
                -{formatAmount(stats?.monthlyExpenses ?? 0)} <span className="text-lg font-normal text-gray-400">RON</span>
              </p>
            </div>
          </div>
        )}

        {/* Navigație */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/banks"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center"
          >
            <p className="text-2xl mb-2">🏦</p>
            <p className="font-semibold text-gray-900">Bănci</p>
            <p className="text-sm text-gray-500 mt-1">Gestionează băncile tale</p>
          </Link>
          <Link
            href="/dashboard/categories"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center"
          >
            <p className="text-2xl mb-2">📂</p>
            <p className="font-semibold text-gray-900">Categorii</p>
            <p className="text-sm text-gray-500 mt-1">Categorii venituri și cheltuieli</p>
          </Link>
          <Link
            href="/dashboard/currencies"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center"
          >
            <p className="text-2xl mb-2">💱</p>
            <p className="font-semibold text-gray-900">Valute</p>
            <p className="text-sm text-gray-500 mt-1">Administrează valutele</p>
          </Link>
          <Link
            href="/dashboard/transactions"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center"
          >
            <p className="text-2xl mb-2">💸</p>
            <p className="font-semibold text-gray-900">Tranzacții</p>
            <p className="text-sm text-gray-500 mt-1">Vezi și adaugă tranzacții</p>
          </Link>
          <Link
            href="/dashboard/upload"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center"
          >
            <p className="text-2xl mb-2">📤</p>
            <p className="font-semibold text-gray-900">Upload</p>
            <p className="text-sm text-gray-500 mt-1">Importă CSV sau Excel</p>
          </Link>
          <Link
            href="/dashboard/reports"
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow text-center"
          >
            <p className="text-2xl mb-2">📊</p>
            <p className="font-semibold text-gray-900">Rapoarte</p>
            <p className="text-sm text-gray-500 mt-1">Grafice cheltuieli și venituri</p>
          </Link>
        </div>

        {/* Empty State */}
        {!loading && stats?.totalBalance === 0 && stats?.monthlyIncome === 0 && stats?.monthlyExpenses === 0 && (
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg text-center">
            <p className="text-gray-600">
              Nu ai încă tranzacții. Valorile de 0.00 RON sunt normale - vei adăuga tranzacții în lecțiile următoare.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
