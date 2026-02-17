import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createId } from '@paralleldrive/cuid2';

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

    return NextResponse.json({ categories: categories || [] });
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

    if (!type || !['income', 'expense'].includes(type)) {
      return NextResponse.json({ error: 'Tipul trebuie să fie income sau expense' }, { status: 400 });
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
