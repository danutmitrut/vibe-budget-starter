import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createId } from '@paralleldrive/cuid2';
import { getAllCategories } from '@/lib/auto-categorization/categories-rules';

// Mapare categorie → tip (expense/income/transfer)
const CATEGORY_TYPE_MAP: Record<string, string> = {
  'Venituri': 'income',
  'Transfer Intern': 'transfer',
  'Transferuri': 'transfer',
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('is_system_category', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;

    // Seed automat: verifică ce categorii predefinite lipsesc și le creează
    const existingNames = new Set((categories || []).map(c => c.name.toLowerCase()));
    const allPredefined = getAllCategories();
    const missing = allPredefined.filter(cat => !existingNames.has(cat.name.toLowerCase()));

    if (missing.length > 0) {
      const seedCategories = missing.map((cat) => ({
        id: createId(),
        user_id: user.id,
        name: cat.name,
        type: CATEGORY_TYPE_MAP[cat.name] || 'expense',
        icon: cat.icon,
        description: cat.description,
        is_system_category: true,
      }));

      const { data: seeded, error: seedError } = await supabase
        .from('categories')
        .insert(seedCategories)
        .select();

      if (seedError) throw seedError;

      console.log(`[API/CATEGORIES] Seeded ${seeded?.length} missing categories for user ${user.id}`);
      // Returnăm toate categoriile (existente + nou create)
      const allCategories = [...(categories || []), ...(seeded || [])];
      allCategories.sort((a, b) => {
        if (a.is_system_category !== b.is_system_category) return a.is_system_category ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      return NextResponse.json({ categories: allCategories });
    }

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[API/CATEGORIES] GET Error:', error);
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, icon } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Numele categoriei este obligatoriu' }, { status: 400 });
    }

    if (!type || !['income', 'expense', 'transfer'].includes(type)) {
      return NextResponse.json({ error: 'Tipul trebuie să fie income, expense sau transfer' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        id: createId(),
        user_id: user.id,
        name: name.trim(),
        type,
        icon: icon || '📁',
        is_system_category: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ category: data }, { status: 201 });
  } catch (error) {
    console.error('[API/CATEGORIES] POST Error:', error);
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}
