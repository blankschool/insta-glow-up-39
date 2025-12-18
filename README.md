# Instagram Analytics (no login)

App de análise de dados do Instagram usando o **Instagram Graph API**, com **token armazenado em secrets do Supabase** (não exposto no frontend).

## Como funciona

- Frontend (Vite/React) chama a Edge Function `ig-dashboard`.
- A Edge Function usa `IG_BUSINESS_ID` + `IG_ACCESS_TOKEN` (Supabase secrets) para buscar:
  - User Insights (accounts_engaged, reach, total_interactions, likes, comments, saved, shares, replies, profile_links_taps, views)
  - Demografia (follower_demographics, engaged_audience_demographics quando disponível)
  - Media insights por item (posts/reels) e stories (best-effort)
  - Page Insights (opcional, se `FB_PAGE_ID` estiver configurado)

## Setup

1) Crie `.env.local`:

- `VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_ANON_KEY`
- Opcional: `VITE_IG_BUSINESS_ID=...` (se não setar, a function usa o secret `IG_BUSINESS_ID`)

2) Configure secrets no Supabase:

- `supabase secrets set IG_BUSINESS_ID="..." IG_ACCESS_TOKEN="..."`
- Opcional: `supabase secrets set FB_PAGE_ID="..."` (habilita Page Insights)

3) Deploy da Edge Function:

- `supabase functions deploy ig-dashboard`

4) Rodar:

- `npm i`
- `npm run dev`

