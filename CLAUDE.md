# Vibe Budget - Conventii pentru Claude

## Despre proiect

Aplicatie de buget personal construita in cursul de Vibe Coding.
Stack: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Drizzle ORM + Supabase Auth.

## Reguli OBLIGATORII

1. **Citeste fisierele existente** inainte sa generezi cod nou
2. **Copiaza stilul exact** din fisierele de referinta
3. **Nu adauga dependente noi** fara aprobare explicita
4. **Nu modifica structura** folderelor existente
5. **Pastreaza comentariile** existente in cod

## Structura proiectului

```
app/
  api/              # API Routes (Next.js Route Handlers)
  dashboard/        # Pagini protejate (autentificare necesara)
  login/            # Pagini publice
  register/
lib/
  db/               # Schema Drizzle, conexiune DB
  supabase/         # Client Supabase (browser + server)
  auto-categorization/  # Reguli categorii
  utils/            # Helpers (file-parser, etc.)
migrations/         # SQL migrations pentru Supabase
```

## Autentificare

Folosim **Supabase Auth** (NU custom JWT):
- `supabase.auth.signUp()` pentru register
- `supabase.auth.signInWithPassword()` pentru login
- `supabase.auth.getUser()` pentru verificare user
- Middleware in `middleware.ts` protejeaza rutele `/dashboard/*`
- Row Level Security (RLS) in Supabase asigura izolarea datelor per user

## API Routes pattern

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }

    const { data } = await supabase
      .from("tabela")
      .select("*")
      .eq("user_id", user.id);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[API] Error:", error);
    return NextResponse.json({ error: "Eroare server" }, { status: 500 });
  }
}
```

## Naming conventions

| Element | Conventie | Exemplu |
|---------|-----------|---------|
| Fisiere | kebab-case | `file-parser.ts` |
| Componente React | PascalCase | `TransactionList` |
| Functii | camelCase | `formatAmount()` |
| DB columns | snake_case | `user_id`, `created_at` |

## Tailwind CSS - Design

- Fundal: gradient teal-to-orange (`bg-gradient-to-br from-teal-50 to-orange-50`)
- Cards: glassmorphism (`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg`)
- Accent: teal + portocaliu
- Font: Geist Sans + Geist Mono

## NU face urmatoarele

- NU adauga biblioteci noi fara aprobare
- NU schimba structura folderelor
- NU modifica schema DB fara migratie
- NU folosi `any` in TypeScript
- NU ignora erorile TypeScript
- NU sterge comentariile existente
