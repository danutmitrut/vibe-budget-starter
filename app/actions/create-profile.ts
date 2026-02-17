'use server';

/**
 * SERVER ACTION - Creare Profil Utilizator
 *
 * Verifică dacă utilizatorul autentificat are un profil în tabela `users`.
 * Dacă nu există, îl creează automat folosind datele din Supabase Auth.
 *
 * Folosește Supabase client (REST API) în loc de Drizzle (conexiune directă).
 * Apelat la fiecare load de dashboard - transparent pentru utilizator.
 */

import { createClient } from '@/lib/supabase/server';

export async function ensureUserProfile() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Neautentificat' };
    }

    // Verifică dacă profilul există deja
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      return { success: true, profile: existingProfile };
    }

    // Creează profil nou cu datele din Supabase Auth
    const { data: newProfile, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || 'Utilizator',
        native_currency: 'RON',
      })
      .select()
      .single();

    if (error) {
      console.error('[CREATE_PROFILE] Insert error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, profile: newProfile };
  } catch (error) {
    console.error('[CREATE_PROFILE] Error:', error);
    return { success: false, error: 'Eroare la crearea profilului' };
  }
}
