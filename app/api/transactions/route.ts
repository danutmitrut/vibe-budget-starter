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

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*, banks(id, name, color), categories(id, name, icon, type)')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ transactions: transactions || [] });
  } catch (error) {
    console.error('[API/TRANSACTIONS] GET Error:', error);
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
    const { date, description, amount, bank_id, category_id, currency } = body;

    if (!date) {
      return NextResponse.json({ error: 'Data este obligatorie' }, { status: 400 });
    }

    if (!description || description.trim() === '') {
      return NextResponse.json({ error: 'Descrierea este obligatorie' }, { status: 400 });
    }

    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return NextResponse.json({ error: 'Suma este obligatorie' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        id: createId(),
        user_id: user.id,
        date,
        description: description.trim(),
        amount: Number(amount),
        bank_id: bank_id || null,
        category_id: category_id || null,
        currency: currency || 'RON',
      })
      .select('*, banks(id, name, color), categories(id, name, icon, type)')
      .single();

    if (error) throw error;

    return NextResponse.json({ transaction: data }, { status: 201 });
  } catch (error) {
    console.error('[API/TRANSACTIONS] POST Error:', error);
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 });
  }
}
