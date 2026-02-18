'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { parseCSV, parseExcel, ParsedTransaction } from '@/lib/utils/file-parser';

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
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; categorized: number } | null>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setParsedTransactions([]);
    setParseError(null);

    if (!file) return;

    setParsing(true);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let result;

      if (extension === 'csv') {
        result = await parseCSV(file);
      } else if (extension === 'xlsx' || extension === 'xls') {
        result = await parseExcel(file);
      } else {
        setParseError('Format nesuportat. Folosește CSV sau Excel (.xlsx, .xls)');
        setParsing(false);
        return;
      }

      if (!result.success) {
        setParseError(result.error || 'Eroare la citirea fișierului');
      } else if (result.transactions.length === 0) {
        setParseError('Nu s-au găsit tranzacții în fișier');
      } else {
        setParsedTransactions(result.transactions);
        toast.success(`${result.transactions.length} tranzacții citite din fișier`);
      }
    } catch {
      setParseError('Eroare neașteptată la procesarea fișierului');
    } finally {
      setParsing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedBankId || parsedTransactions.length === 0) return;

    setImporting(true);

    try {
      const transactions = parsedTransactions.map((t) => ({
        bankId: selectedBankId,
        date: t.date,
        description: t.description,
        amount: t.amount,
        currency: t.currency || 'RON',
        type: t.amount < 0 ? 'expense' : 'income',
      }));

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Eroare la import');
        return;
      }

      setImportResult({ imported: data.imported, categorized: data.categorized });
      toast.success(`${data.imported} tranzacții importate cu succes!`);
    } catch {
      toast.error('Eroare de conexiune la server');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedTransactions([]);
    setParseError(null);
    setImportResult(null);
    setSelectedBankId('');
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
            {!selectedBankId && parsedTransactions.length > 0 && (
              <p className="text-amber-600 text-sm">Selectează o bancă pentru a putea importa</p>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          {importResult ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 text-5xl">✓</div>
              <p className="text-gray-900 font-semibold text-lg">
                {importResult.imported} tranzacții importate, {importResult.categorized} categorizate automat
              </p>
              <div className="flex gap-3 justify-center mt-4">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl transition-colors"
                >
                  Încarcă alt fișier
                </button>
                <Link
                  href="/dashboard/transactions"
                  className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-xl transition-colors"
                >
                  Vezi tranzacțiile
                </Link>
              </div>
            </div>
          ) : parsing ? (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
              <p className="text-gray-500">Se procesează fișierul...</p>
            </div>
          ) : parseError ? (
            <div className="text-center">
              <p className="text-red-600 font-medium">{parseError}</p>
              <p className="text-gray-400 text-sm mt-1">Verifică fișierul și încearcă din nou</p>
            </div>
          ) : parsedTransactions.length > 0 ? (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 text-gray-500 font-medium">Dată</th>
                      <th className="text-left py-2 pr-4 text-gray-500 font-medium">Descriere</th>
                      <th className="text-right py-2 pr-4 text-gray-500 font-medium">Sumă</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Valută</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedTransactions.slice(0, 10).map((t, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{t.date}</td>
                        <td className="py-2 pr-4 text-gray-900 truncate max-w-[200px]">{t.description}</td>
                        <td className={`py-2 pr-4 text-right font-medium whitespace-nowrap ${t.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {t.amount.toFixed(2)}
                        </td>
                        <td className="py-2 text-right text-gray-500">{t.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedTransactions.length > 10 && (
                <p className="text-gray-400 text-sm mt-3 text-center">
                  ...și încă {parsedTransactions.length - 10} tranzacții
                </p>
              )}
              <p className="text-gray-700 font-medium mt-4 text-center">
                Total: {parsedTransactions.length} tranzacții găsite în fișier
              </p>
              <button
                onClick={handleUpload}
                disabled={!selectedBankId || importing}
                className={`w-full mt-4 px-5 py-2.5 font-medium rounded-xl transition-colors ${
                  selectedBankId && !importing
                    ? 'bg-teal-500 hover:bg-teal-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {importing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Se importă...
                  </span>
                ) : (
                  `Importă ${parsedTransactions.length} tranzacții`
                )}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-500">Selectează un fișier pentru preview</p>
              <p className="text-gray-400 text-sm mt-1">
                Formatul acceptat: CSV sau Excel (.xlsx, .xls)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
