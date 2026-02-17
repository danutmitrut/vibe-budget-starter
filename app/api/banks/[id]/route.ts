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
    const { name, color } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Numele băncii este obligatoriu' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('banks')
      .update({
        name: name.trim(),
        color: color || '#6366f1',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ bank: data });
  } catch (error) {
    console.error('[API/BANKS] PATCH Error:', error);
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

    const { error } = await supabase
      .from('banks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API/BANKS] DELETE Error:', error);
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}
