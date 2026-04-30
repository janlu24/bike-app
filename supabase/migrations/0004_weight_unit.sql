-- ============================================================================
-- 0004: profiles.weight_unit ('g' | 'kg') — Anzeige-Einheit pro Profil.
-- Datenhaltung in items.weight_g bleibt immer Gramm.
-- ============================================================================

alter table public.profiles
  add column if not exists weight_unit text not null default 'g';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_weight_unit_check'
  ) then
    alter table public.profiles
      add constraint profiles_weight_unit_check
        check (weight_unit in ('g', 'kg'));
  end if;
end$$;
