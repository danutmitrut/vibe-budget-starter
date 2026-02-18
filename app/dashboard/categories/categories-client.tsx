'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  icon: string;
  is_system_category: boolean;
  created_at: string;
}

const EMOJI_LIST = ['🍔', '🚗', '🏠', '💰', '🎮', '📱', '✈️', '🛒', '👕', '🎬', '💊', '📚', '🎁', '💼', '🏦', '🛍️'];

export default function CategoriesClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [formIcon, setFormIcon] = useState('📁');

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Eroare la încărcarea categoriilor');
      const data = await res.json();
      setCategories(data.categories);
    } catch (error) {
      toast.error('Eroare la încărcarea categoriilor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormType('expense');
    setFormIcon('📁');
    setIsAdding(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      toast.error('Numele categoriei este obligatoriu');
      return;
    }

    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, icon: formIcon }),
        });
        if (!res.ok) throw new Error('Eroare la actualizare');
        toast.success('Categoria a fost actualizată!');
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formName, type: formType, icon: formIcon }),
        });
        if (!res.ok) throw new Error('Eroare la adăugare');
        toast.success('Categoria a fost adăugată!');
      }

      resetForm();
      fetchCategories();
    } catch (error) {
      toast.error(editingCategory ? 'Eroare la actualizarea categoriei' : 'Eroare la adăugarea categoriei');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormType(category.type);
    setFormIcon(category.icon);
    setIsAdding(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Sigur vrei să ștergi această categorie?')) return;

    try {
      const res = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Eroare la ștergere');
      }
      toast.success('Categoria a fost ștearsă!');
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || 'Eroare la ștergerea categoriei');
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');
  const transferCategories = categories.filter(c => c.type === 'transfer');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const renderTable = (title: string, items: Category[]) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      {items.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg text-center">
          <p className="text-gray-500">Nu ai categorii de {title.toLowerCase()}.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Icon</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Nume</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {items.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4 text-2xl">{cat.icon}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {cat.name}
                    {cat.is_system_category && (
                      <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">sistem</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="px-3 py-1.5 text-sm text-teal-600 hover:bg-teal-50 rounded-lg transition-colors mr-2"
                    >
                      Editează
                    </button>
                    {!cat.is_system_category && (
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Șterge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Categorii</h1>
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
            + Adaugă Categorie
          </button>
        )}

        {/* Form Adaugă/Editează */}
        {isAdding && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingCategory ? 'Editează Categorie' : 'Adaugă Categorie'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nume Categorie
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Streaming, Freelancing..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                {!editingCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tip
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as 'expense' | 'income' | 'transfer')}
                      className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="expense">Cheltuială</option>
                      <option value="income">Venit</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Emoji Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon: <span className="text-2xl ml-1">{formIcon}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormIcon(emoji)}
                      className={`text-2xl p-2 rounded-lg transition-colors ${
                        formIcon === emoji
                          ? 'bg-teal-100 ring-2 ring-teal-500'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-colors"
                >
                  {editingCategory ? 'Salvează' : 'Adaugă'}
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
        )}

        {/* Tabele Categorii */}
        {renderTable('Cheltuieli', expenseCategories)}
        {renderTable('Venituri', incomeCategories)}
        {transferCategories.length > 0 && renderTable('Transferuri', transferCategories)}
      </div>
    </div>
  );
}
