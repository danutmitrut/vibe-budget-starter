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

    const { data: banks, error } = await supabase
      .from('banks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ banks: banks || [] });
  } catch (error) {
    console.error('[API/BANKS] GET Error:', error);
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
    const { name, color } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Numele băncii este obligatoriu' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('banks')
      .insert({
        id: createId(),
        user_id: user.id,
        name: name.trim(),
        color: color || '#6366f1',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ bank: data }, { status: 201 });
  } catch (error) {
    console.error('[API/BANKS] POST Error:', error);
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}
