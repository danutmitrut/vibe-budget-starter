'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
  created_at: string;
}

const PRESETS = [
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

export default function CurrenciesClient() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formName, setFormName] = useState('');

  const fetchCurrencies = async () => {
    try {
      const res = await fetch('/api/currencies');
      if (!res.ok) throw new Error('Eroare la încărcarea valutelor');
      const data = await res.json();
      setCurrencies(data.currencies);
    } catch (error) {
      toast.error('Eroare la încărcarea valutelor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const handlePreset = async (preset: typeof PRESETS[0]) => {
    try {
      const res = await fetch('/api/currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      });

      if (res.status === 409) {
        toast.error('Valuta există deja');
        return;
      }

      if (!res.ok) throw new Error('Eroare la adăugare');
      toast.success(`${preset.code} a fost adăugat!`);
      fetchCurrencies();
    } catch (error) {
      toast.error('Eroare la adăugarea valutei');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCode.trim() || !formSymbol.trim() || !formName.trim()) {
      toast.error('Toate câmpurile sunt obligatorii');
      return;
    }

    try {
      const res = await fetch('/api/currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formCode, symbol: formSymbol, name: formName }),
      });

      if (res.status === 409) {
        toast.error('Valuta există deja');
        return;
      }

      if (!res.ok) throw new Error('Eroare la adăugare');
      toast.success('Valuta a fost adăugată!');
      setFormCode('');
      setFormSymbol('');
      setFormName('');
      setIsAdding(false);
      fetchCurrencies();
    } catch (error) {
      toast.error('Eroare la adăugarea valutei');
    }
  };

  const handleDelete = async (currencyId: string) => {
    if (!confirm('Sigur vrei să ștergi această valută?')) return;

    try {
      const res = await fetch(`/api/currencies/${currencyId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Eroare la ștergere');
      toast.success('Valuta a fost ștearsă!');
      fetchCurrencies();
    } catch (error) {
      toast.error('Eroare la ștergerea valutei');
    }
  };

  const existingCodes = currencies.map(c => c.code);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Valute</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            ← Înapoi la Dashboard
          </Link>
        </div>

        {/* Preset-uri */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Adaugă rapid</h2>
          <div className="flex flex-wrap gap-3">
            {PRESETS.map((preset) => {
              const exists = existingCodes.includes(preset.code);
              return (
                <button
                  key={preset.code}
                  onClick={() => handlePreset(preset)}
                  disabled={exists}
                  className={`px-4 py-2.5 font-medium rounded-xl transition-colors ${
                    exists
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-teal-500 hover:bg-teal-600 text-white'
                  }`}
                >
                  {preset.code} ({preset.symbol})
                </button>
              );
            })}
          </div>
        </div>

        {/* Buton Adaugă Custom */}
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="mb-6 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors"
          >
            + Adaugă Valută Custom
          </button>
        )}

        {/* Form Custom */}
        {isAdding && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Adaugă Valută Custom</h2>
            <form onSubmit={handleSubmit} className="flex items-end gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="CHF"
                  className="w-24 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                <input
                  type="text"
                  value={formSymbol}
                  onChange={(e) => setFormSymbol(e.target.value)}
                  placeholder="Fr"
                  className="w-20 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Swiss Franc"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-colors"
              >
                Adaugă
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors"
              >
                Anulează
              </button>
            </form>
          </div>
        )}

        {/* Tabel Valute */}
        {currencies.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center">
            <p className="text-gray-500">Nu ai încă valute adăugate.</p>
            <p className="text-gray-400 text-sm mt-1">Folosește butoanele de preset sau adaugă o valută custom.</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Code</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Symbol</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((currency) => (
                  <tr key={currency.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-4 font-bold text-gray-900">{currency.code}</td>
                    <td className="px-6 py-4 text-gray-700">{currency.symbol}</td>
                    <td className="px-6 py-4 text-gray-700">{currency.name}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(currency.id)}
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
        )}
      </div>
    </div>
  );
}
