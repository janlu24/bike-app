-- ============================================================================
-- 0011: tour_items — add feedback columns (rating + note) + UPDATE RLS policy
--
-- Feedback is stored directly on tour_items (1:1 relationship, no separate
-- table needed). Both columns are nullable; at least one must be non-null
-- at the application layer.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Add feedback columns to tour_items
-- ----------------------------------------------------------------------------
ALTER TABLE public.tour_items
  ADD COLUMN IF NOT EXISTS rating smallint
    CONSTRAINT tour_items_rating_range CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

ALTER TABLE public.tour_items
  ADD COLUMN IF NOT EXISTS note text
    CONSTRAINT tour_items_note_length CHECK (note IS NULL OR char_length(note) <= 1000);

-- ----------------------------------------------------------------------------
-- RLS: tour_items — UPDATE policy (was missing before this migration)
-- Only the tour owner may update rating/note on their packlist entries.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "tour_items_update_owner" ON public.tour_items;
CREATE POLICY "tour_items_update_owner"
  ON public.tour_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tours t
      WHERE t.id = tour_items.tour_id
        AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tours t
      WHERE t.id = tour_items.tour_id
        AND t.user_id = auth.uid()
    )
  );
