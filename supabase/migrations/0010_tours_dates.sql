-- ============================================================================
-- 0010: tours — rename date → start_date, add end_date
-- ============================================================================

ALTER TABLE public.tours RENAME COLUMN date TO start_date;

ALTER TABLE public.tours ADD COLUMN end_date date;

ALTER TABLE public.tours ADD CONSTRAINT tours_end_date_check
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);

-- Update the date index to reflect the rename.
DROP INDEX IF EXISTS tours_date_idx;
CREATE INDEX IF NOT EXISTS tours_start_date_idx ON public.tours (start_date DESC NULLS LAST);
