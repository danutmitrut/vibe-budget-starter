import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key Anthropic lipsă. Adaugă ANTHROPIC_API_KEY în .env.local' }, { status: 500 });
    }

    // Primim rezumatul agregat de la client (NU tranzacții individuale)
    const body = await request.json();
    const { expensesByCategory, expensesByMonth, totalExpenses, totalIncome, balance } = body;

    if (!expensesByCategory || !expensesByMonth) {
      return NextResponse.json({ error: 'Date insuficiente pentru analiză' }, { status: 400 });
    }

    // Construim prompt-ul cu datele agregate
    const prompt = `Ești un coach financiar personal. Analizează următoarele date financiare ale unui utilizator și oferă sfaturi personalizate ÎN LIMBA ROMÂNĂ.

REZUMAT FINANCIAR:
- Total cheltuieli: ${totalExpenses} RON
- Total venituri: ${totalIncome} RON
- Balanță: ${balance} RON

CHELTUIELI PE CATEGORII:
${expensesByCategory.map((c: { name: string; value: number }) => `- ${c.name}: ${c.value} RON`).join('\n')}

TREND LUNAR (cheltuieli):
${expensesByMonth.map((m: { name: string; total: number }) => `- ${m.name}: ${m.total} RON`).join('\n')}

Răspunde STRICT în format JSON valid (fără markdown, fără backticks):
{
  "healthScore": <număr 0-100>,
  "healthLabel": "<Excelent/Bun/Atenție/Critic>",
  "tips": ["<sfat 1>", "<sfat 2>", "<sfat 3>"],
  "positive": "<o observație pozitivă despre ce face bine utilizatorul>",
  "summary": "<o propoziție scurtă despre starea financiară generală>"
}

Reguli:
- Health score: 80-100 Excelent, 60-79 Bun, 40-59 Atenție, 0-39 Critic
- Sfaturile trebuie să fie SPECIFICE, bazate pe categoriile și sumele reale
- Observația pozitivă trebuie să fie sinceră și bazată pe date
- Răspunde DOAR cu JSON-ul, nimic altceva`;

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    // Extragem textul din răspuns
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Parsăm JSON-ul (curățăm eventuale backticks markdown)
    let jsonStr = responseText.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }

    const analysis = JSON.parse(jsonStr);

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    console.error('[API/AI-COACH] Error:', error);
    const message = error instanceof Error ? error.message : 'Eroare la analiza AI';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
