# Flat meals – setup
1. `npx create-next-app@latest flatmeal --ts --tailwind --app` then copy these files over it (keep `@/` alias).
2. `npm i @supabase/supabase-js @supabase/ssr lucide-react`
3. Supabase: run `supabase/schema.sql` in the SQL editor. Enable Auth > Providers > Google (add Google client ID/secret).
   Add redirect URLs: `http://localhost:3000/auth/callback` and your production URL + `/auth/callback`.
4. `.env.local`: `NEXT_PUBLIC_SUPABASE_URL=...` `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
5. Change `timezone` default in `flats` (default `Asia/Dhaka`) – the midnight lock uses it.
6. Optional: set `require_approval=true` on your flat to make new joiners wait for admin approval.
