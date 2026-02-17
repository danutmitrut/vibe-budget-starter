'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Bank {
  id: string;
  name: string;
  color: string;
}

export default function UploadClient() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBankId, setSelectedBankId] = useState('');

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch('/api/banks');
        if (!res.ok) throw new Error('Eroare');
        const data = await res.json();
        setBanks(data.banks);
      } catch {
        // Pagina merge fără bănci
      } finally {
        setLoading(false);
      }
    };
    fetchBanks();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUpload = () => {
    toast.info('Upload va fi funcțional în Săptămâna 5, Lecția 5.1');
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
          <h1 className="text-3xl font-bold text-gray-900">Upload Tranzacții</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            ← Înapoi la Dashboard
          </Link>
        </div>

        {/* Upload Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Importă din CSV sau Excel</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fișier</label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bancă</label>
              <select
                value={selectedBankId}
                onChange={(e) => setSelectedBankId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Selectează bancă...</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleUpload}
              className="w-full px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-colors"
            >
              Upload
            </button>
          </div>
        </div>

        {/* Preview Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center">
          <p className="text-gray-500">Selectează un fișier pentru preview</p>
          <p className="text-gray-400 text-sm mt-1">
            Formatul acceptat: CSV sau Excel (.xlsx, .xls)
          </p>
        </div>
      </div>
    </div>
  );
}
