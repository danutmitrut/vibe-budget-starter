# Vibe Budget - Starter Kit

Aplicatie de gestiune financiara personala. Starter kit pentru cursul de Vibe Coding.

## Ce include

- **Schema DB completa** (6 tabele: users, banks, currencies, categories, transactions, user_keywords)
- **Supabase config** (client browser + server + middleware auth)
- **Auto-categorization engine** (reguli categorii + keyword matcher)
- **File parser** (CSV + Excel import)
- **Landing page** cu prezentarea aplicatiei
- **Migrations SQL** pentru setup initial baza de date

## Ce vei construi in curs

- Sistem autentificare (login + register) cu Supabase Auth
- Dashboard cu rezumat financiar
- Management banci, categorii, valute (CRUD)
- Lista tranzactii + upload CSV/Excel
- Rapoarte si grafice
- AI insights cu Claude

## Setup

1. Cloneaza repo-ul
2. `npm install`
3. Creaza proiect Supabase
4. Copiaza `.env.example` in `.env.local` si completeaza cheile
5. `npm run dev`

## Stack

- Next.js 16 + React 19
- TypeScript
- Tailwind CSS 4
- Drizzle ORM
- Supabase (Auth + PostgreSQL + RLS)
