-- ============================================================================
-- 0008: Rename item_templates → item_groups and items.template_id → items.group_id
--       Pure rename migration — no schema shape changes, no data loss.
-- ============================================================================

-- Rename table
ALTER TABLE public.item_templates RENAME TO item_groups;

-- Rename table-level constraints
ALTER TABLE public.item_groups
  RENAME CONSTRAINT item_templates_name_length TO item_groups_name_length;
ALTER TABLE public.item_groups
  RENAME CONSTRAINT item_templates_keys_not_empty TO item_groups_keys_not_empty;
ALTER TABLE public.item_groups
  RENAME CONSTRAINT item_templates_keys_max TO item_groups_keys_max;
ALTER TABLE public.item_groups
  RENAME CONSTRAINT item_templates_unique_name_per_user_category
  TO item_groups_unique_name_per_user_category;

-- Rename indexes on item_groups
ALTER INDEX IF EXISTS public.item_templates_user_id_idx RENAME TO item_groups_user_id_idx;
ALTER INDEX IF EXISTS public.item_templates_user_cat_idx RENAME TO item_groups_user_cat_idx;
ALTER INDEX IF EXISTS public.item_templates_pkey RENAME TO item_groups_pkey;

-- Rename trigger
ALTER TRIGGER trg_item_templates_updated_at ON public.item_groups
  RENAME TO trg_item_groups_updated_at;

-- Drop old RLS policies (now on the renamed table)
DROP POLICY IF EXISTS "item_templates_select_owner" ON public.item_groups;
DROP POLICY IF EXISTS "item_templates_insert_owner" ON public.item_groups;
DROP POLICY IF EXISTS "item_templates_update_owner" ON public.item_groups;
DROP POLICY IF EXISTS "item_templates_delete_owner" ON public.item_groups;

-- Recreate RLS policies with updated names (same logic, owner-only)
CREATE POLICY "item_groups_select_owner"
  ON public.item_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "item_groups_insert_owner"
  ON public.item_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "item_groups_update_owner"
  ON public.item_groups FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "item_groups_delete_owner"
  ON public.item_groups FOR DELETE
  USING (auth.uid() = user_id);

-- Rename column on items and its FK constraint + index
ALTER TABLE public.items RENAME COLUMN template_id TO group_id;
ALTER TABLE public.items RENAME CONSTRAINT items_template_id_fkey TO items_group_id_fkey;
ALTER INDEX IF EXISTS public.items_template_id_idx RENAME TO items_group_id_idx;
