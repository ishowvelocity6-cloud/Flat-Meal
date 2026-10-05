create table flats(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  access_code text unique not null,
  timezone text not null default 'Asia/Dhaka',
  require_approval boolean not null default false,
  created_by uuid, created_at timestamptz default now());

create table profiles(
  id uuid primary key references auth.users on delete cascade,
  name text, email text, avatar_url text,
  flat_id uuid references flats on delete set null,
  role text not null default 'member' check (role in ('admin','member')),
  status text not null default 'active' check (status in ('active','pending')));

-- No row = default (lunch 1, dinner 1)
create table daily_meals(
  user_id uuid references profiles on delete cascade,
  flat_id uuid references flats on delete cascade,
  meal_date date,
  lunch smallint not null default 1 check (lunch in (0,1)),
  dinner smallint not null default 1 check (dinner in (0,1)),
  updated_by uuid, updated_at timestamptz default now(),
  primary key(user_id, meal_date));

create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,name,email,avatar_url)
  values(new.id,new.raw_user_meta_data->>'full_name',new.email,new.raw_user_meta_data->>'avatar_url');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create function my_flat() returns uuid language sql stable security definer set search_path=public as
$$ select flat_id from profiles where id=auth.uid() and status='active' $$;

alter table flats enable row level security;
alter table profiles enable row level security;
alter table daily_meals enable row level security;

create policy flats_read on flats for select using (id=my_flat());
create policy profiles_read on profiles for select using (id=auth.uid() or flat_id=my_flat());
create policy meals_read on daily_meals for select using (flat_id=my_flat());
-- All writes go through the RPCs below (no insert/update/delete policies).

-- Hide the access code from direct reads; admins get it via get_access_code()
revoke select on flats from authenticated;
grant select(id,name,timezone) on flats to authenticated;

create function create_flat(p_name text) returns void language plpgsql security definer set search_path=public as $$
declare f uuid;
begin
  if (select flat_id from profiles where id=auth.uid()) is not null then raise exception 'Already in a flat'; end if;
  insert into flats(name,access_code,created_by) values(p_name, upper(substr(md5(random()::text),1,6)), auth.uid()) returning id into f;
  update profiles set flat_id=f, role='admin', status='active' where id=auth.uid();
end $$;

create function join_flat(p_code text) returns void language plpgsql security definer set search_path=public as $$
declare f flats;
begin
  select * into f from flats where access_code=upper(trim(p_code));
  if f.id is null then raise exception 'Invalid access code'; end if;
  update profiles set flat_id=f.id, role='member',
    status=case when f.require_approval then 'pending' else 'active' end
  where id=auth.uid() and flat_id is null;
end $$;

create function assert_admin() returns uuid language plpgsql security definer set search_path=public as $$
declare f uuid;
begin
  select flat_id into f from profiles where id=auth.uid() and role='admin' and status='active';
  if f is null then raise exception 'Admin only'; end if;
  return f;
end $$;

create function get_access_code() returns text language sql security definer set search_path=public as
$$ select access_code from flats where id=assert_admin() $$;

create function regenerate_code() returns text language plpgsql security definer set search_path=public as $$
declare c text := upper(substr(md5(random()::text),1,6));
begin update flats set access_code=c where id=assert_admin(); return c; end $$;

create function approve_member(p_user uuid) returns void language plpgsql security definer set search_path=public as $$
begin update profiles set status='active' where id=p_user and flat_id=assert_admin(); end $$;

create function remove_member(p_user uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  if p_user=auth.uid() then raise exception 'Admin cannot remove self'; end if;
  update profiles set flat_id=null, role='member', status='active' where id=p_user and flat_id=assert_admin();
end $$;

-- Lock rule: members may edit only dates AFTER today (flat timezone), i.e. until 11:59 PM the night before.
create function set_meal(p_user uuid, p_date date, p_lunch int, p_dinner int) returns void
language plpgsql security definer set search_path=public as $$
declare me profiles; tz text;
begin
  select * into me from profiles where id=auth.uid() and status='active';
  select timezone into tz from flats where id=me.flat_id;
  if not exists(select 1 from profiles where id=p_user and flat_id=me.flat_id and status='active') then
    raise exception 'Not a flatmate'; end if;
  if me.role<>'admin' then
    if p_user<>me.id then raise exception 'Forbidden'; end if;
    if p_date <= (now() at time zone tz)::date then raise exception 'Meal is locked'; end if;
  end if;
  insert into daily_meals(user_id,flat_id,meal_date,lunch,dinner,updated_by)
  values(p_user,me.flat_id,p_date,p_lunch,p_dinner,auth.uid())
  on conflict(user_id,meal_date) do update set lunch=excluded.lunch, dinner=excluded.dinner, updated_by=auth.uid(), updated_at=now();
end $$;
