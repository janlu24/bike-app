-- ============================================================================
-- 0009: tours + tour_items
--       tours      — user-owned tour records with raw ride data
--       tour_items — junction table linking tours to garage items (packlist)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enum: tour_status
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'tour_status') then
    create type public.tour_status as enum ('planned', 'completed');
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- Table: tours
-- ----------------------------------------------------------------------------
create table if not exists public.tours (
  id                       uuid             primary key default gen_random_uuid(),
  user_id                  uuid             not null references public.profiles(id) on delete cascade,
  name                     text             not null,
  date                     date,
  start_location           text,
  destination              text,
  status                   public.tour_status not null default 'planned',
  planned_distance_km      numeric(8,2),
  planned_elevation_up_m   integer,
  planned_elevation_down_m integer,
  actual_distance_km       numeric(8,2),
  actual_elevation_up_m    integer,
  actual_elevation_down_m  integer,
  duration_hours           integer,
  duration_minutes         integer,
  is_public                boolean          not null default false,
  external_source          text,
  external_id              text,
  created_at               timestamptz      not null default now(),
  updated_at               timestamptz      not null default now(),

  constraint tours_name_length
    check (char_length(name) between 1 and 100),
  constraint tours_start_location_length
    check (start_location is null or char_length(start_location) <= 200),
  constraint tours_destination_length
    check (destination is null or char_length(destination) <= 200),
  constraint tours_planned_distance_nonneg
    check (planned_distance_km is null or planned_distance_km >= 0),
  constraint tours_planned_elevation_up_nonneg
    check (planned_elevation_up_m is null or planned_elevation_up_m >= 0),
  constraint tours_planned_elevation_down_nonneg
    check (planned_elevation_down_m is null or planned_elevation_down_m >= 0),
  constraint tours_actual_distance_nonneg
    check (actual_distance_km is null or actual_distance_km >= 0),
  constraint tours_actual_elevation_up_nonneg
    check (actual_elevation_up_m is null or actual_elevation_up_m >= 0),
  constraint tours_actual_elevation_down_nonneg
    check (actual_elevation_down_m is null or actual_elevation_down_m >= 0),
  constraint tours_duration_hours_nonneg
    check (duration_hours is null or duration_hours >= 0),
  constraint tours_duration_minutes_range
    check (duration_minutes is null or (duration_minutes >= 0 and duration_minutes <= 59))
);

create index if not exists tours_user_id_idx   on public.tours (user_id);
create index if not exists tours_date_idx      on public.tours (date desc nulls last);
create index if not exists tours_is_public_idx on public.tours (is_public);

drop trigger if exists trg_tours_updated_at on public.tours;
create trigger trg_tours_updated_at
  before update on public.tours
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS: tours
-- ----------------------------------------------------------------------------
alter table public.tours enable row level security;

drop policy if exists "tours_select_owner_or_public" on public.tours;
create policy "tours_select_owner_or_public"
  on public.tours for select
  using (auth.uid() = user_id or is_public = true);

drop policy if exists "tours_insert_owner" on public.tours;
create policy "tours_insert_owner"
  on public.tours for insert
  with check (auth.uid() = user_id);

drop policy if exists "tours_update_owner" on public.tours;
create policy "tours_update_owner"
  on public.tours for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "tours_delete_owner" on public.tours;
create policy "tours_delete_owner"
  on public.tours for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Table: tour_items  (packlist — junction table)
-- ----------------------------------------------------------------------------
create table if not exists public.tour_items (
  id       uuid        primary key default gen_random_uuid(),
  tour_id  uuid        not null references public.tours(id) on delete cascade,
  item_id  uuid        not null references public.items(id) on delete cascade,
  added_at timestamptz not null default now(),

  constraint tour_items_unique unique (tour_id, item_id)
);

create index if not exists tour_items_tour_id_idx on public.tour_items (tour_id);
create index if not exists tour_items_item_id_idx on public.tour_items (item_id);

-- ----------------------------------------------------------------------------
-- RLS: tour_items
-- ----------------------------------------------------------------------------
alter table public.tour_items enable row level security;

-- SELECT: tour owner or public tour
drop policy if exists "tour_items_select_owner_or_public" on public.tour_items;
create policy "tour_items_select_owner_or_public"
  on public.tour_items for select
  using (
    exists (
      select 1 from public.tours t
      where t.id = tour_items.tour_id
        and (t.user_id = auth.uid() or t.is_public = true)
    )
  );

-- INSERT: only tour owner
drop policy if exists "tour_items_insert_owner" on public.tour_items;
create policy "tour_items_insert_owner"
  on public.tour_items for insert
  with check (
    exists (
      select 1 from public.tours t
      where t.id = tour_items.tour_id
        and t.user_id = auth.uid()
    )
  );

-- DELETE: only tour owner
drop policy if exists "tour_items_delete_owner" on public.tour_items;
create policy "tour_items_delete_owner"
  on public.tour_items for delete
  using (
    exists (
      select 1 from public.tours t
      where t.id = tour_items.tour_id
        and t.user_id = auth.uid()
    )
  );
