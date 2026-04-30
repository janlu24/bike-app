-- ============================================================================
-- 0003: items.parent_id (Self-Reference Part → Bike) + brand NOT NULL
-- ON DELETE SET NULL: gelöschtes Bike kaskadiert nicht auf Parts.
-- ============================================================================

alter table public.items
  add column if not exists parent_id uuid
    references public.items(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'items_parent_not_self'
  ) then
    alter table public.items
      add constraint items_parent_not_self check (parent_id is null or parent_id <> id);
  end if;
end$$;

create index if not exists items_parent_id_idx on public.items (parent_id);

-- brand verpflichtend (Backfill für bestehende NULL-Zeilen)
update public.items
  set brand = 'Unbekannt'
  where brand is null or btrim(brand) = '';

alter table public.items
  alter column brand set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'items_brand_not_blank'
  ) then
    alter table public.items
      add constraint items_brand_not_blank check (btrim(brand) <> '');
  end if;
end$$;
