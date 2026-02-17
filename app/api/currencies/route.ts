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

    const { data: currencies, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ currencies: currencies || [] });
  } catch (error) {
    console.error('[API/CURRENCIES] GET Error:', error);
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
    const { code, symbol, name } = body;

    if (!code || !symbol || !name) {
      return NextResponse.json({ error: 'Code, symbol și name sunt obligatorii' }, { status: 400 });
    }

    // Verifică duplicat
    const { data: existing } = await supabase
      .from('currencies')
      .select('id')
      .eq('user_id', user.id)
      .eq('code', code.trim().toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Valuta există deja' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('currencies')
      .insert({
        id: createId(),
        user_id: user.id,
        code: code.trim().toUpperCase(),
        symbol: symbol.trim(),
        name: name.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ currency: data }, { status: 201 });
  } catch (error) {
    console.error('[API/CURRENCIES] POST Error:', error);
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}
