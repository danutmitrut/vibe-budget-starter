/**
 * DASHBOARD PAGE - Server Component
 *
 * Verifică autentificarea server-side și creează profilul utilizatorului
 * dacă acesta nu există încă (primul login după confirmare email).
 *
 * Apoi renderizează DashboardClient cu datele utilizatorului.
 */

import { createClient } from '@/lib/supabase/server';
import { ensureUserProfile } from '@/app/actions/create-profile';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
  // Verifică autentificarea server-side
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Creează profilul dacă nu există (primul login)
  const { success, profile } = await ensureUserProfile();

  if (!success || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg text-center">
          <p className="text-red-600 text-lg">Eroare la încărcarea profilului.</p>
          <p className="text-gray-600 mt-2">Încearcă să te autentifici din nou.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardClient
      userEmail={user.email || ''}
      profileName={profile.name}
    />
  );
}
