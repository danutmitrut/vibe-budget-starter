'use client';

/**
 * PAGINA DE REGISTER - Vibe Budget
 *
 * Permite crearea unui cont nou cu email și parolă.
 * Folosește Supabase Auth - nu stocăm parole în baza noastră de date.
 * După register, utilizatorul primește email de confirmare.
 */

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmMessage, setShowConfirmMessage] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Supabase trimite email de confirmare
    setShowConfirmMessage(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">💰 Vibe Budget</h1>
          <p className="text-gray-600 mt-2">Creează un cont nou</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          {showConfirmMessage ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">📧</div>
              <h2 className="text-xl font-semibold text-gray-900">
                Verifică email-ul!
              </h2>
              <p className="text-gray-600">
                Am trimis un link de confirmare la <strong>{email}</strong>.
                Deschide email-ul și apasă pe link pentru a-ți activa contul.
              </p>
              <Link
                href="/login"
                className="inline-block mt-4 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors"
              >
                Mergi la Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nume
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Numele tău"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@exemplu.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Parolă
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Minim 6 caractere"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? 'Se creează contul...' : 'Creează cont'}
              </button>
            </form>
          )}

          {!showConfirmMessage && (
            <p className="text-center text-sm text-gray-600 mt-6">
              Ai deja cont?{' '}
              <Link href="/login" className="text-teal-600 hover:text-teal-700 font-medium">
                Autentifică-te
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
