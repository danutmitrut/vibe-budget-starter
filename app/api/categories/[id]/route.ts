import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, icon } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Numele categoriei este obligatoriu' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('categories')
      .update({
        name: name.trim(),
        icon: icon || '📁',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ category: data });
  } catch (error) {
    console.error('[API/CATEGORIES] PATCH Error:', error);
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
    }

    const { id } = await params;

    // Verifică dacă e categorie sistem
    const { data: category } = await supabase
      .from('categories')
      .select('is_system_category')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (category?.is_system_category) {
      return NextResponse.json({ error: 'Categoriile sistem nu pot fi șterse' }, { status: 403 });
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API/CATEGORIES] DELETE Error:', error);
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}
