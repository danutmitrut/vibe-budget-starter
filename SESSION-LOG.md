# Session Log

## 2026-02-17 - Lecția 4.3: Transactions List + Upload Form UI

### Ce s-a făcut
- Transactions API routes: GET (cu JOIN banks+categories) + POST + DELETE (`app/api/transactions/`)
- Transactions List page cu tabel, filtre (date range, bancă, categorie), căutare după descriere
- Modal adăugare tranzacție (dată, descriere, sumă, bancă dropdown, categorie dropdown)
- Upload Form UI - file input CSV/Excel, dropdown bancă, buton Upload (placeholder S5.1)
- Navigare dashboard: adăugat carduri Tranzacții + Upload (total 5 carduri)
- Toți 7 pașii din GHID-4.3 completați

### Ce rămâne
- [ ] Commit + push tot codul S4 (auth + CRUD + transactions + upload)
- [ ] Săptămâna 5, Lecția 5.1 - Upload Logic (CSV/Excel parsing, transformări, import)

### Commits
- Niciun commit nou (modificări locale, ca în sesiunile anterioare)

### Decizii importante
- Filtrare client-side (nu server-side) - potrivit pentru proiect didactic
- Supabase JOIN cu `select('*, banks(...), categories(...)')` - obiecte îmbricate
- `max-w-5xl` pe transactions (mai lat decât `max-w-2xl` de la banks) - 6 coloane
- Upload page = doar UI, logica vine în S5.1
- Sume colorate: roșu (cheltuieli), verde (venituri)
- Dată formatată cu `+T00:00:00` pentru a evita timezone issues

---

## 2026-02-17 - Pregătire Lecția 4.3 (nepornită)

### Ce s-a făcut
- Actualizat 6 ghiduri curs (GHID-6.2, 7.1, 7.2, 8.1, 8.2) - "COMANDA" -> "Pasul" + diacritice (sesiunea anterioară, pe vibe-website)
- Explorat codebase vibe-budget-starter pentru a identifica ce lipsește pentru 4.3
- Pornit serverul de dev, citit pattern-ul CRUD existent (banks, categories)
- Citit GHID-4.3 complet - plan clar pentru filmare

### Ce rămâne
- [ ] Filmare Lecția 4.3 - Tranzacții + Upload Form UI (7 pași din ghid)
  - Pasul 1: Transactions List (tabel + filtre + search)
  - Pasul 2: Test filtre
  - Pasul 3: Form adăugare tranzacție (modal)
  - Pasul 4: Test adăugare manuală (3 tranzacții)
  - Pasul 5: Upload Form UI (doar layout, fără logică)
  - Pasul 6: Test Upload UI
  - Pasul 7: Verifică navigare între pagini
- [ ] Commit + push tot codul din S4 (auth + CRUD + transactions) după ce filmăm 4.3

### Commits
- Niciun commit nou (doar pregătire)

### Decizii importante
- Schema tabelului transactions trebuie verificată din migration files (nu din schema.sql)
- Codul din 4.1/4.2 rămâne necomis - se comite totul la final de S4

---

## 2026-02-16 - Lecția 4.2: CRUD Managers (Banks, Categories, Currencies)

### Ce s-a făcut
- Banks Manager complet (API routes + pagină cu color picker)
- Categories Manager complet (API routes + pagină cu 2 tabele Income/Expense + emoji picker)
- Currencies Manager complet (API routes + pagină cu preset RON/EUR/USD/GBP + form custom)
- Navigație în dashboard către cele 3 managere (carduri cu emoji)
- Actualizat GHID-4.2 pe Desktop (explicație CRUD + origine James Martin 1983)

### Ce rămâne
- [ ] Filmare Lecția 4.3 - Tranzacții + Upload Form UI
- [ ] Modificările locale (auth + CRUD) nu se commită - cursanții le construiesc singuri

### Commits
- `4242519` Add database migration and fix Drizzle config for PostgreSQL (push la început de sesiune)
- (restul modificărilor sunt locale, intentionat necommise)

### Decizii importante
- Fișierele CRUD rămân doar local - cursanții le construiesc cu Claude Code
- Același pattern CRUD repetat de 3 ori: API routes (GET/POST/PATCH/DELETE) + Server Component (auth) + Client Component (UI)
- Categories: categorii sistem nu se pot șterge (check în API + buton ascuns în UI)
- Currencies: verificare duplicat pe code (409 Conflict)

---

## 2026-02-16 - Lecția 4.1: Setup, Auth + Dashboard

### Ce s-a făcut
- Creat proiect Supabase (ref: jdnxawcsztdzlocfshzj, org: enifbusiness)
- Configurat `.env.local` cu cheile Supabase
- Creat tabelele DB (6 tabele + RLS policies) via Supabase Management API
- Creat `migrations/setup_database.sql` pentru cursanți
- Implementat register (`app/register/page.tsx`) cu Supabase Auth
- Implementat login (`app/login/page.tsx`) cu Supabase Auth
- Creat server action `ensureUserProfile()` pentru creare profil la primul login
- Creat API route `/api/reports/stats` pentru statistici dashboard
- Creat dashboard (server component + client component) cu 3 stat cards
- Adăugat butoane CTA pe homepage (Register + Login)
- Actualizat GHID-4.1 cu Pasul 2.2 (migrație DB) + diacritice
- Actualizat GHID-4.2 cu pași (nu comenzi) + diacritice + explicație CRUD + origine James Martin

### Ce rămâne
- [ ] Commit + push modificări pe GitHub (cursanții au nevoie de fișierele noi)
- [ ] Filmare Lecția 4.2 - CRUD Managers (Banks, Categories, Currencies)
- [ ] Lecția 4.3 - Tranzacții + Upload Form UI

### Commits
- `8f400af` Initial starter kit for Vibe Budget course (existent)
- (modificări locale necommise: auth, dashboard, migrație)

### Decizii importante
- Drizzle ORM abandonat pentru queries (nu se conectează prin Supabase Pooler) - folosim Supabase REST client
- `drizzle.config.ts` schimbat de la SQLite la PostgreSQL
- Email confirmation rămâne ACTIV (flow real)
- Creat `setup_database.sql` ca să nu pățească cursanții aceeași eroare cu DB gol

---
