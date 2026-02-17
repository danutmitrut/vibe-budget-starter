import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BanksClient from './banks-client';

export default async function BanksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <BanksClient />;
}
