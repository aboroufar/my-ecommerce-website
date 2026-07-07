# Supabase setup

## 1. Create the project
Create a project at supabase.com, then grab these from **Project Settings → API**:
- Project URL
- `anon` public key
- `service_role` key (secret — server-only)

Copy `.env.local.example` (repo root) to `.env.local` and fill these in.

## 2. Run the migrations

**Option A — SQL Editor (no CLI needed):**
Open **SQL Editor** in the Supabase dashboard, paste and run each file in
`supabase/migrations/` in filename order (they're numbered), then optionally
run `supabase/seed.sql` for sample products.

**Option B — Supabase CLI (recommended once you're iterating locally):**
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

## 3. Enable email auth
In the dashboard: **Authentication → Providers** — email is on by default.
For production, also set your site URL under **Authentication → URL Configuration**
so confirmation/reset emails link back to your real domain.

## 4. Verify RLS
In **Table Editor**, confirm each table shows "RLS enabled." The migrations
already define policies — public read access to active products/categories,
and customers restricted to their own cart/orders/addresses. All writes to
products/orders happen server-side via the service_role key (see
`src/lib/supabase/admin.ts`), which intentionally bypasses RLS.

## 5. Keep types in sync (optional but recommended)
Once linked via the CLI:
```bash
npx supabase gen types typescript --project-id <your-project-ref> > src/lib/supabase/types.ts
```
This replaces the hand-written types in that file with ones generated
directly from your live schema.
