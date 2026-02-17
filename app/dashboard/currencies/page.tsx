import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CurrenciesClient from './currencies-client';

export default async function CurrenciesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <CurrenciesClient />;
}
