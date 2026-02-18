'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Bank {
  id: string;
  name: string;
  color: string;
}

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
  bank_id: string | null;
  category_id: string | null;
  banks: Bank | null;
  categories: Category | null;
  created_at: string;
}

export default function TransactionsClient() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formDate, setFormDate] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBankId, setFormBankId] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingCategoryFor, setEditingCategoryFor] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (!res.ok) throw new Error('Eroare la încărcarea tranzacțiilor');
      const data = await res.json();
      setTransactions(data.transactions);
    } catch (error) {
      toast.error('Eroare la încărcarea tranzacțiilor');
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/banks');
      if (!res.ok) throw new Error('Eroare');
      const data = await res.json();
      setBanks(data.banks);
    } catch {
      // Filtrele nu vor avea opțiuni dar pagina merge
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Eroare');
      const data = await res.json();
      setCategories(data.categories);
    } catch {
      // Filtrele nu vor avea opțiuni dar pagina merge
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchBanks();
    fetchCategories();
  }, []);

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Sigur vrei să ștergi această tranzacție?')) return;

    try {
      const res = await fetch(`/api/transactions/${transactionId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Eroare la ștergere');
      toast.success('Tranzacția a fost ștearsă!');
      fetchTransactions();
    } catch (error) {
      toast.error('Eroare la ștergerea tranzacției');
    }
  };

  const handleUpdateCategory = async (transactionId: string, categoryId: string | null) => {
    try {
      const res = await fetch(`/api/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId }),
      });
      if (!res.ok) throw new Error('Eroare la actualizare');
      const data = await res.json();
      setTransactions(prev =>
        prev.map(t => t.id === transactionId ? data.transaction : t)
      );
      setEditingCategoryFor(null);
      toast.success(categoryId ? 'Categoria a fost actualizată!' : 'Categoria a fost eliminată!');
    } catch {
      toast.error('Eroare la actualizarea categoriei');
    }
  };

  const resetForm = () => {
    setFormDate('');
    setFormAmount('');
    setFormDescription('');
    setFormBankId('');
    setFormCategoryId('');
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formDate) {
      toast.error('Data este obligatorie');
      return;
    }
    if (!formDescription.trim()) {
      toast.error('Descrierea este obligatorie');
      return;
    }
    if (!formAmount || isNaN(Number(formAmount))) {
      toast.error('Suma este obligatorie');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formDate,
          description: formDescription.trim(),
          amount: Number(formAmount),
          bank_id: formBankId || null,
          category_id: formCategoryId || null,
        }),
      });
      if (!res.ok) throw new Error('Eroare la adăugare');
      toast.success('Tranzacția a fost adăugată!');
      resetForm();
      fetchTransactions();
    } catch (error) {
      toast.error('Eroare la adăugarea tranzacției');
    } finally {
      setSubmitting(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    const value = Number(amount);
    const formatted = Math.abs(value).toFixed(2);
    const sign = value < 0 ? '-' : '+';
    return `${sign}${formatted} ${currency}`;
  };

  const hasActiveFilters = filterBank || filterCategory || filterDateFrom || filterDateTo || searchQuery;

  const filteredTransactions = transactions.filter((t) => {
    if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filterBank && t.bank_id !== filterBank) {
      return false;
    }
    if (filterCategory && t.category_id !== filterCategory) {
      return false;
    }
    if (filterDateFrom && t.date < filterDateFrom) {
      return false;
    }
    if (filterDateTo && t.date > filterDateTo) {
      return false;
    }
    return true;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setFilterBank('');
    setFilterCategory('');
    setFilterDateFrom('');
    setFilterDateTo('');
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
          <h1 className="text-3xl font-bold text-gray-900">Tranzacții</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            ← Înapoi la Dashboard
          </Link>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6 gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-colors"
          >
            + Adaugă Tranzacție
          </button>
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Caută după descriere..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">De la</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Până la</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bancă</label>
              <select
                value={filterBank}
                onChange={(e) => setFilterBank(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              >
                <option value="">Toate băncile</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              >
                <option value="">Toate categoriile</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Resetează
              </button>
            )}
          </div>
        </div>

        {/* Table or Empty State */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center">
            <p className="text-gray-500">Nicio tranzacție</p>
            <p className="text-gray-400 text-sm mt-1">
              {hasActiveFilters
                ? 'Încearcă să modifici filtrele.'
                : 'Apasă pe "Adaugă Tranzacție" pentru a începe.'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Dată</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Descriere</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Bancă</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Categorie</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Sumă</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(t.date + 'T00:00:00').toLocaleDateString('ro-RO')}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 text-sm">
                        {t.description}
                      </td>
                      <td className="px-6 py-4">
                        {t.banks ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: t.banks.color }}
                            />
                            <span className="text-sm text-gray-700">{t.banks.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingCategoryFor === t.id ? (
                          <select
                            autoFocus
                            defaultValue={t.category_id || ''}
                            onChange={(e) => handleUpdateCategory(t.id, e.target.value || null)}
                            onBlur={() => setEditingCategoryFor(null)}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="">Fără categorie</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                          </select>
                        ) : t.categories ? (
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-700">
                              {t.categories.icon} {t.categories.name}
                            </span>
                            <button
                              onClick={() => setEditingCategoryFor(t.id)}
                              className="ml-1 p-0.5 text-gray-400 hover:text-teal-600 transition-colors"
                              title="Schimbă categoria"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                                <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L3.05 10.476a1.75 1.75 0 0 0-.446.79l-.675 2.696a.25.25 0 0 0 .304.304l2.696-.675a1.75 1.75 0 0 0 .79-.446l7.963-7.963a1.75 1.75 0 0 0 0-2.475Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleUpdateCategory(t.id, null)}
                              className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                              title="Elimină categoria"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                                <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingCategoryFor(t.id)}
                            className="text-sm text-gray-400 hover:text-teal-600 transition-colors"
                          >
                            + Adaugă
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-sm whitespace-nowrap">
                        <span className={Number(t.amount) < 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatAmount(t.amount, t.currency)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Șterge
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-400 mt-3 text-right">
              {filteredTransactions.length} din {transactions.length} tranzacții
            </p>
          </>
        )}
        {/* Modal Adaugă Tranzacție */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Adaugă Tranzacție</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dată</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descriere</label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Ex: Kaufland Cluj, Salariu..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sumă (negativ = cheltuială, pozitiv = venit)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="Ex: -125.50 sau 2500"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bancă</label>
                  <select
                    value={formBankId}
                    onChange={(e) => setFormBankId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Selectează bancă...</option>
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Selectează categorie...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-medium rounded-xl transition-colors"
                  >
                    {submitting ? 'Se salvează...' : 'Adaugă'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors"
                  >
                    Anulează
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
