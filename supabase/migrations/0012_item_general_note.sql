-- PROJ-13: Add general_note column to items
-- Stores a free-text comment about an item (e.g. "knarzt bei Nässe").
-- Nullable; empty strings are normalized to NULL at the application layer.

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS general_note text
    CHECK (char_length(general_note) <= 2000);
