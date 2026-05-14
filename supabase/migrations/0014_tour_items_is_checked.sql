-- ============================================================================
-- 0014: tour_items — add is_checked column for persistent check-off state
--
-- Packing check-off state is stored directly on tour_items.
-- The column defaults to false so all existing rows are unaffected.
-- The existing tour_items_update_owner RLS policy (from 0011) covers this
-- column automatically — no new policies needed.
-- ============================================================================

ALTER TABLE public.tour_items
  ADD COLUMN IF NOT EXISTS is_checked boolean
    NOT NULL DEFAULT false;
