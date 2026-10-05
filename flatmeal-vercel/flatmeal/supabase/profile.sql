-- Profile editing + avatar storage. Run once in Supabase SQL Editor.
create or replace function update_profile(p_name text, p_avatar text) returns void
language sql security definer set search_path=public as $$
  update profiles set name = coalesce(nullif(trim(p_name),''), name), avatar_url = coalesce(p_avatar, avatar_url)
  where id = auth.uid() $$;
grant execute on function update_profile(text, text) to authenticated;

insert into storage.buckets(id, name, public) values ('avatars','avatars', true) on conflict (id) do nothing;
drop policy if exists "avatar read" on storage.objects;
drop policy if exists "avatar insert own" on storage.objects;
drop policy if exists "avatar update own" on storage.objects;
create policy "avatar read" on storage.objects for select using (bucket_id='avatars');
create policy "avatar insert own" on storage.objects for insert to authenticated
  with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "avatar update own" on storage.objects for update to authenticated
  using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
