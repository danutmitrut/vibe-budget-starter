'use client';

/**
 * PAGINA DE LOGIN - Vibe Budget
 *
 * Permite autentificarea cu email și parolă.
 * Folosește Supabase Auth - verificare automată email confirmat.
 * După login, utilizatorul este redirecționat la dashboard.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Login reușit - redirect la dashboard
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">💰 Vibe Budget</h1>
          <p className="text-gray-600 mt-2">Autentifică-te în cont</p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
          <form onSubmit={handleLogin} className="space-y-5">
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
                placeholder="Parola ta"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? 'Se autentifică...' : 'Autentifică-te'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Nu ai cont?{' '}
            <Link href="/register" className="text-teal-600 hover:text-teal-700 font-medium">
              Creează unul nou
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
