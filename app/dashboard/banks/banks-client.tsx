'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Bank {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export default function BanksClient() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#6366f1');

  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/banks');
      if (!res.ok) throw new Error('Eroare la încărcarea băncilor');
      const data = await res.json();
      setBanks(data.banks);
    } catch (error) {
      toast.error('Eroare la încărcarea băncilor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormColor('#6366f1');
    setIsAdding(false);
    setEditingBank(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      toast.error('Numele băncii este obligatoriu');
      return;
    }

    try {
      if (editingBank) {
        const res = await fetch(`/api/banks/${editingBank.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, color: formColor }),
        });
        if (!res.ok) throw new Error('Eroare la actualizare');
        toast.success('Banca a fost actualizată!');
      } else {
        const res = await fetch('/api/banks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, color: formColor }),
        });
        if (!res.ok) throw new Error('Eroare la adăugare');
        toast.success('Banca a fost adăugată!');
      }

      resetForm();
      fetchBanks();
    } catch (error) {
      toast.error(editingBank ? 'Eroare la actualizarea băncii' : 'Eroare la adăugarea băncii');
    }
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormName(bank.name);
    setFormColor(bank.color);
    setIsAdding(true);
  };

  const handleDelete = async (bankId: string) => {
    if (!confirm('Sigur vrei să ștergi această bancă?')) return;

    try {
      const res = await fetch(`/api/banks/${bankId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Eroare la ștergere');
      toast.success('Banca a fost ștearsă!');
      fetchBanks();
    } catch (error) {
      toast.error('Eroare la ștergerea băncii');
    }
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bănci</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            ← Înapoi la Dashboard
          </Link>
        </div>

        {/* Buton Adaugă */}
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="mb-6 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-colors"
          >
            + Adaugă Bancă
          </button>
        )}

        {/* Form Adaugă/Editează */}
        {isAdding && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingBank ? 'Editează Bancă' : 'Adaugă Bancă'}
            </h2>
            <form onSubmit={handleSubmit} className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nume Bancă
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: ING, Revolut, BCR..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Culoare
                </label>
                <input
                  type="color"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer border border-gray-300"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-colors"
              >
                {editingBank ? 'Salvează' : 'Adaugă'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors"
              >
                Anulează
              </button>
            </form>
          </div>
        )}

        {/* Lista Bănci */}
        {banks.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center">
            <p className="text-gray-500">Nu ai încă bănci adăugate.</p>
            <p className="text-gray-400 text-sm mt-1">Apasă pe &quot;Adaugă Bancă&quot; pentru a începe.</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Culoare</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Nume</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {banks.map((bank) => (
                  <tr key={bank.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-6 py-4">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: bank.color }}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{bank.name}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(bank)}
                        className="px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors mr-2"
                      >
                        Editează
                      </button>
                      <button
                        onClick={() => handleDelete(bank.id)}
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
