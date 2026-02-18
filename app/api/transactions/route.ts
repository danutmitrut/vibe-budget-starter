import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createId } from '@paralleldrive/cuid2';
import { autoCategorizeByCategoryName } from '@/lib/auto-categorization/categories-rules';

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

    // BULK IMPORT: dacă body conține un array de tranzacții
    if (body.transactions && Array.isArray(body.transactions)) {
      // Fetch categoriile user-ului o singură dată
      const { data: userCategories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', user.id);

      // Map: categoryName → categoryId pentru lookup rapid
      const categoryMap = new Map<string, string>();
      if (userCategories) {
        for (const cat of userCategories) {
          categoryMap.set(cat.name.toLowerCase(), cat.id);
        }
      }

      let categorized = 0;
      const transactionsToInsert = [];

      for (const t of body.transactions) {
        if (!t.date || !t.description) continue;

        // Auto-categorizare: găsim category name din reguli
        let categoryId: string | null = null;
        const categoryName = autoCategorizeByCategoryName(t.description);
        if (categoryName) {
          const foundId = categoryMap.get(categoryName.toLowerCase());
          if (foundId) {
            categoryId = foundId;
            categorized++;
          }
        }

        // Normalizare sumă: type=expense + amount pozitiv → negativ
        let amount = Number(t.amount);
        if (t.type === 'expense' && amount > 0) {
          amount = -amount;
        }

        transactionsToInsert.push({
          id: createId(),
          user_id: user.id,
          bank_id: t.bankId || null,
          category_id: categoryId,
          date: t.date,
          description: t.description.trim(),
          amount,
          currency: t.currency || 'RON',
        });
      }

      if (transactionsToInsert.length === 0) {
        return NextResponse.json({ error: 'Nicio tranzacție validă de importat' }, { status: 400 });
      }

      const { error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (error) throw error;

      return NextResponse.json({
        message: 'Import reușit',
        imported: transactionsToInsert.length,
        categorized,
      }, { status: 201 });
    }

    // SINGLE TRANSACTION: comportamentul existent
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
