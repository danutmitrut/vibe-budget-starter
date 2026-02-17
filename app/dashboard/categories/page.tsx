import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CategoriesClient from './categories-client';

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <CategoriesClient />;
}
