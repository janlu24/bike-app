-- ============================================================================
-- The Setup Registry — Consolidated Reset & Init Script
-- Konsolidiert: Migrations 0001–0007 (PROJ-1 bis PROJ-9)
--
-- WARNUNG: Dieses Skript löscht ALLE Daten in public.profiles, public.items
-- und public.item_templates. Nur im Supabase SQL Editor auf einer
-- Entwicklungs- oder Reset-Instanz ausführen, NICHT auf Produktionsdaten.
-- ============================================================================


-- ============================================================================
-- SECTION 1: CLEANUP — Triggers, Policies, Tabellen, Funktionen, Typen
-- ============================================================================

-- Trigger auf auth.users (PROJ-9: Auto-Profile)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger auf public-Tabellen
DROP TRIGGER IF EXISTS trg_profiles_updated_at       ON public.profiles;
DROP TRIGGER IF EXISTS trg_items_updated_at           ON public.items;
DROP TRIGGER IF EXISTS trg_item_templates_updated_at  ON public.item_templates;

-- Storage-Policies: item-images (PROJ-3)
DROP POLICY IF EXISTS "item_images_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "item_images_owner_insert"  ON storage.objects;
DROP POLICY IF EXISTS "item_images_owner_update"  ON storage.objects;
DROP POLICY IF EXISTS "item_images_owner_delete"  ON storage.objects;

-- Storage-Policies: avatars (PROJ-2 / PROJ-6)
DROP POLICY IF EXISTS "avatars_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_insert"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_update"  ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_delete"  ON storage.objects;

-- RLS-Policies: items
DROP POLICY IF EXISTS "items_select_public_or_owner" ON public.items;
DROP POLICY IF EXISTS "items_insert_owner"           ON public.items;
DROP POLICY IF EXISTS "items_update_owner"           ON public.items;
DROP POLICY IF EXISTS "items_delete_owner"           ON public.items;

-- RLS-Policies: item_templates
DROP POLICY IF EXISTS "item_templates_select_owner" ON public.item_templates;
DROP POLICY IF EXISTS "item_templates_insert_owner" ON public.item_templates;
DROP POLICY IF EXISTS "item_templates_update_owner" ON public.item_templates;
DROP POLICY IF EXISTS "item_templates_delete_owner" ON public.item_templates;

-- RLS-Policies: profiles
DROP POLICY IF EXISTS "profiles_select_public_or_owner" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self"             ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self"             ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_self"             ON public.profiles;

-- Tabellen (Reihenfolge: abhängige zuerst)
DROP TABLE IF EXISTS public.items          CASCADE;
DROP TABLE IF EXISTS public.item_templates CASCADE;
DROP TABLE IF EXISTS public.profiles       CASCADE;

-- Funktionen
DROP FUNCTION IF EXISTS public.handle_new_user()  CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at()   CASCADE;

-- Enum
DROP TYPE IF EXISTS public.item_category CASCADE;


-- ============================================================================
-- SECTION 2: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- SECTION 3: ENUM (PROJ-3)
-- ============================================================================

CREATE TYPE public.item_category AS ENUM ('Bike', 'Part', 'Gear', 'Clothing');


-- ============================================================================
-- SECTION 4: TABELLEN
-- Reihenfolge: profiles → item_templates → items
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles (PROJ-1, PROJ-2, PROJ-4, PROJ-6)
-- Quellen: 0001_init + 0004_weight_unit
-- ----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT        UNIQUE NOT NULL
                             CHECK (char_length(username) BETWEEN 3 AND 32),
  full_name    TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  is_public    BOOLEAN     NOT NULL DEFAULT false,
  weight_unit  TEXT        NOT NULL DEFAULT 'g'
                             CONSTRAINT profiles_weight_unit_check
                             CHECK (weight_unit IN ('g', 'kg')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX profiles_is_public_idx ON public.profiles (is_public);

-- ----------------------------------------------------------------------------
-- item_templates (PROJ-8)
-- Quelle: 0005_item_templates
-- Muss vor items erstellt werden (items.template_id → item_templates.id)
-- ----------------------------------------------------------------------------
CREATE TABLE public.item_templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category      public.item_category NOT NULL,
  name          TEXT        NOT NULL,
  property_keys TEXT[]      NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT item_templates_name_length
    CHECK (char_length(name) BETWEEN 1 AND 80),
  CONSTRAINT item_templates_keys_not_empty
    CHECK (array_length(property_keys, 1) >= 1),
  CONSTRAINT item_templates_keys_max
    CHECK (array_length(property_keys, 1) <= 25),
  CONSTRAINT item_templates_unique_name_per_user_category
    UNIQUE (user_id, category, name)
);

CREATE INDEX item_templates_user_id_idx  ON public.item_templates (user_id);
CREATE INDEX item_templates_user_cat_idx ON public.item_templates (user_id, category);

-- ----------------------------------------------------------------------------
-- items (PROJ-3, PROJ-4, PROJ-5, PROJ-7, PROJ-8)
-- Quellen: 0001_init + 0002_item_images + 0003_item_parent_relation
--          + 0005_item_templates
-- ----------------------------------------------------------------------------
CREATE TABLE public.items (
  id          UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID               NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category    public.item_category NOT NULL,
  brand       TEXT               NOT NULL
                                   CONSTRAINT items_brand_not_blank CHECK (btrim(brand) <> ''),
  model       TEXT,
  weight_g    INTEGER            CHECK (weight_g IS NULL OR weight_g >= 0),
  is_public   BOOLEAN            NOT NULL DEFAULT false,
  metadata    JSONB              NOT NULL DEFAULT '{}'::jsonb,
  image_url   TEXT,
  parent_id   UUID               REFERENCES public.items(id) ON DELETE SET NULL,
  template_id UUID               REFERENCES public.item_templates(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ        NOT NULL DEFAULT now(),

  CONSTRAINT items_parent_not_self
    CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE INDEX items_user_id_idx    ON public.items (user_id);
CREATE INDEX items_category_idx   ON public.items (category);
CREATE INDEX items_is_public_idx  ON public.items (is_public);
CREATE INDEX items_parent_id_idx  ON public.items (parent_id);
CREATE INDEX items_template_id_idx ON public.items (template_id);
CREATE INDEX items_metadata_gin   ON public.items USING gin (metadata);


-- ============================================================================
-- SECTION 5: FUNKTIONEN & TRIGGER
-- ============================================================================

-- updated_at-Trigger-Funktion (shared, PROJ-1)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_item_templates_updated_at
  BEFORE UPDATE ON public.item_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-Profile nach Registrierung (PROJ-9, Migration 0007)
-- SECURITY DEFINER: Umgeht RLS, da beim Trigger kein User-Kontext vorhanden ist.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  candidate TEXT;
  fallback  TEXT;
BEGIN
  -- E-Mail-Präfix extrahieren, Sonderzeichen entfernen, lowercase
  candidate := lower(
    regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')
  );

  -- Auf 32 Zeichen kürzen (Max-Länge des username-Constraints)
  candidate := left(candidate, 32);

  -- Deterministischer Fallback aus der UUID (immer eindeutig)
  fallback := 'user_' || left(replace(NEW.id::text, '-', ''), 8);

  -- Fallback verwenden wenn Kandidat zu kurz (<3) oder bereits vergeben
  IF char_length(candidate) < 3
     OR EXISTS (SELECT 1 FROM public.profiles WHERE username = candidate)
  THEN
    candidate := fallback;
  END IF;

  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, candidate);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Fehler loggen ohne PII; User-Erstellung nie blockieren
    RAISE WARNING 'handle_new_user: profile creation failed for user %. sqlstate=%, sqlerrm=%',
      NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items          ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- profiles-Policies
-- ----------------------------------------------------------------------------
-- Öffentliche Profile sichtbar für alle; eigenes Profil immer sichtbar
CREATE POLICY "profiles_select_public_or_owner"
  ON public.profiles FOR SELECT
  USING (is_public = true OR auth.uid() = id);

-- Nur der eigene User darf seinen Profil-Eintrag anlegen
CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Nur der Besitzer darf das Profil bearbeiten
CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Nur der Besitzer darf das Profil löschen
CREATE POLICY "profiles_delete_self"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- item_templates-Policies (immer privat, nur Owner)
-- ----------------------------------------------------------------------------
CREATE POLICY "item_templates_select_owner"
  ON public.item_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "item_templates_insert_owner"
  ON public.item_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "item_templates_update_owner"
  ON public.item_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "item_templates_delete_owner"
  ON public.item_templates FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- items-Policies
-- Sichtbar: Besitzer ODER (Item öffentlich UND Profil öffentlich)
-- ----------------------------------------------------------------------------
CREATE POLICY "items_select_public_or_owner"
  ON public.items FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      is_public = true
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = items.user_id AND p.is_public = true
      )
    )
  );

CREATE POLICY "items_insert_owner"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "items_update_owner"
  ON public.items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "items_delete_owner"
  ON public.items FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================================
-- SECTION 7: STORAGE — Buckets & Policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Bucket: item-images (PROJ-3, öffentlich lesbar)
-- Pfad-Konvention: <auth.uid>/<timestamp>-<random>.<ext>
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

CREATE POLICY "item_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'item-images');

CREATE POLICY "item_images_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'item-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "item_images_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'item-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'item-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "item_images_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'item-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ----------------------------------------------------------------------------
-- Bucket: avatars (PROJ-2 / PROJ-6, öffentlich lesbar)
-- Pfad-Konvention: <auth.uid>/avatar.<ext>
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================================
-- END OF SCRIPT
-- Struktur nach Ausführung:
--   Tabellen:   public.profiles, public.item_templates, public.items
--   Funktionen: public.set_updated_at(), public.handle_new_user()
--   Trigger:    trg_*_updated_at, on_auth_user_created (auf auth.users)
--   Storage:    Bucket "avatars" + "item-images" mit je 4 RLS-Policies
-- ============================================================================
