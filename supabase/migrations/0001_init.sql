-- ============================================================================
-- The Setup Registry – Initial Schema
-- Bezeichner: Englisch. RLS auf allen Tabellen aktiv.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enum: Item-Kategorien
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'item_category') then
    create type public.item_category as enum ('Bike', 'Part', 'Gear', 'Clothing');
  end if;
end$$;

-- ============================================================================
-- Tabelle: profiles (1:1 zu auth.users)
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null check (char_length(username) between 3 and 32),
  full_name   text,
  avatar_url  text,
  bio         text,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_is_public_idx on public.profiles (is_public);

-- ============================================================================
-- Tabelle: items
-- ============================================================================
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  category    public.item_category not null,
  brand       text,
  model       text,
  weight_g    integer check (weight_g is null or weight_g >= 0),
  is_public   boolean not null default false,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists items_user_id_idx   on public.items (user_id);
create index if not exists items_category_idx  on public.items (category);
create index if not exists items_is_public_idx on public.items (is_public);
create index if not exists items_metadata_gin  on public.items using gin (metadata);

-- ----------------------------------------------------------------------------
-- Trigger: updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_items_updated_at on public.items;
create trigger trg_items_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.items    enable row level security;

-- profiles: öffentliche Profile lesbar; Besitzer sieht eigenes; schreiben nur Besitzer
drop policy if exists "profiles_select_public_or_owner" on public.profiles;
create policy "profiles_select_public_or_owner"
  on public.profiles for select
  using (is_public = true or auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_delete_self" on public.profiles;
create policy "profiles_delete_self"
  on public.profiles for delete
  using (auth.uid() = id);

-- items: Besitzer oder öffentliches Item auf öffentlichem Profil
drop policy if exists "items_select_public_or_owner" on public.items;
create policy "items_select_public_or_owner"
  on public.items for select
  using (
    auth.uid() = user_id
    or (
      is_public = true
      and exists (
        select 1 from public.profiles p
        where p.id = items.user_id and p.is_public = true
      )
    )
  );

drop policy if exists "items_insert_owner" on public.items;
create policy "items_insert_owner"
  on public.items for insert
  with check (auth.uid() = user_id);

drop policy if exists "items_update_owner" on public.items;
create policy "items_update_owner"
  on public.items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "items_delete_owner" on public.items;
create policy "items_delete_owner"
  on public.items for delete
  using (auth.uid() = user_id);
