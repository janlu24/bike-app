-- PROJ-15: Bike Preset Manager & Tour Integration
-- Creates bike_presets, preset_items; adds preset_id to tours.

-- ---------------------------------------------------------------------------
-- Table: bike_presets
-- Stores named configuration snapshots for a bike.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bike_presets (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bike_id     uuid        NOT NULL REFERENCES items(id)      ON DELETE CASCADE,
  name        text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  description text                 CHECK (char_length(description) <= 200),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bike_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bike_presets: owner full access"
  ON bike_presets FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS bike_presets_user_id_idx ON bike_presets (user_id);
CREATE INDEX IF NOT EXISTS bike_presets_bike_id_idx ON bike_presets (bike_id);

-- ---------------------------------------------------------------------------
-- Table: preset_items
-- Junction table: freezes the item IDs belonging to a preset snapshot.
-- Both FKs use CASCADE so orphan rows are cleaned up automatically.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS preset_items (
  preset_id uuid NOT NULL REFERENCES bike_presets(id) ON DELETE CASCADE,
  item_id   uuid NOT NULL REFERENCES items(id)        ON DELETE CASCADE,
  PRIMARY KEY (preset_id, item_id)
);

ALTER TABLE preset_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preset_items: owner full access"
  ON preset_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bike_presets
      WHERE bike_presets.id      = preset_items.preset_id
        AND bike_presets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bike_presets
      WHERE bike_presets.id      = preset_items.preset_id
        AND bike_presets.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS preset_items_preset_id_idx ON preset_items (preset_id);

-- ---------------------------------------------------------------------------
-- Alter: tours
-- Add nullable preset_id FK with RESTRICT so active presets cannot be deleted.
-- ---------------------------------------------------------------------------
ALTER TABLE tours
  ADD COLUMN IF NOT EXISTS preset_id uuid
    REFERENCES bike_presets(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS tours_preset_id_idx ON tours (preset_id);
