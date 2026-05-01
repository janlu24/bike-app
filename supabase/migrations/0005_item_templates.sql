-- ============================================================================
-- 0005: item_templates — User-owned templates defining a fixed property-key set
--       per category. items.template_id links back (SET NULL on delete).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: item_templates
-- ----------------------------------------------------------------------------
create table if not exists public.item_templates (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles(id) on delete cascade,
  category      public.item_category not null,
  name          text        not null,
  property_keys text[]      not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint item_templates_name_length
    check (char_length(name) between 1 and 80),
  constraint item_templates_keys_not_empty
    check (array_length(property_keys, 1) >= 1),
  constraint item_templates_keys_max
    check (array_length(property_keys, 1) <= 25),
  constraint item_templates_unique_name_per_user_category
    unique (user_id, category, name)
);

create index if not exists item_templates_user_id_idx
  on public.item_templates (user_id);

create index if not exists item_templates_user_cat_idx
  on public.item_templates (user_id, category);

-- updated_at trigger (reuses existing set_updated_at function from 0001)
drop trigger if exists trg_item_templates_updated_at on public.item_templates;
create trigger trg_item_templates_updated_at
  before update on public.item_templates
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS: item_templates — always private, owner only
-- ----------------------------------------------------------------------------
alter table public.item_templates enable row level security;

drop policy if exists "item_templates_select_owner" on public.item_templates;
create policy "item_templates_select_owner"
  on public.item_templates for select
  using (auth.uid() = user_id);

drop policy if exists "item_templates_insert_owner" on public.item_templates;
create policy "item_templates_insert_owner"
  on public.item_templates for insert
  with check (auth.uid() = user_id);

drop policy if exists "item_templates_update_owner" on public.item_templates;
create policy "item_templates_update_owner"
  on public.item_templates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "item_templates_delete_owner" on public.item_templates;
create policy "item_templates_delete_owner"
  on public.item_templates for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- items.template_id — nullable FK; SET NULL when template is deleted
-- ----------------------------------------------------------------------------
alter table public.items
  add column if not exists template_id uuid
    references public.item_templates(id) on delete set null;

create index if not exists items_template_id_idx
  on public.items (template_id);
