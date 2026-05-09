"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  parseGroupInput,
  parsePropagationDecisions,
  computeGroupDiff,
  isValidGroupId,
} from "@/lib/groups/validation";
import type { GroupFormState } from "./schema";

const empty: GroupFormState = { data: null, fieldErrors: {} };

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return { supabase, user };
}

// ---------------------------------------------------------------------------
// createGroupAction
// ---------------------------------------------------------------------------

export async function createGroupAction(
  _prev: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const parsed = parseGroupInput(formData);
  if (!parsed.data) return parsed;

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { ...empty, error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { error } = await supabase.from("item_groups").insert({
    user_id: user.id,
    category: parsed.data.category,
    name: parsed.data.name,
    property_keys: parsed.data.property_keys,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        data: null,
        fieldErrors: {
          name: "Eine Gruppe mit diesem Namen existiert bereits in dieser Kategorie.",
        },
      };
    }
    return { ...empty, error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }

  revalidatePath("/garage/groups");
  redirect("/garage/groups");
}

// ---------------------------------------------------------------------------
// updateGroupAction
// ---------------------------------------------------------------------------

export async function updateGroupAction(
  groupId: string,
  _prev: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  if (!isValidGroupId(groupId)) {
    return { ...empty, error: "Ungültige Gruppen-ID." };
  }

  const parsed = parseGroupInput(formData);
  if (!parsed.data) return parsed;

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { ...empty, error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  // Load current group to verify ownership and compute diff server-side.
  const { data: existing, error: fetchError } = await supabase
    .from("item_groups")
    .select("property_keys")
    .eq("id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ...empty, error: "Gruppe nicht gefunden." };
  }

  const oldKeys: string[] = existing.property_keys ?? [];
  const newKeys = parsed.data.property_keys;
  const { added: addedKeys, removed: removedKeys } = computeGroupDiff(oldKeys, newKeys);
  const { removedKeysDecision } = parsePropagationDecisions(formData);

  // 1. Update the group itself.
  const { error: updateError } = await supabase
    .from("item_groups")
    .update({ name: parsed.data.name, property_keys: newKeys })
    .eq("id", groupId)
    .eq("user_id", user.id);

  if (updateError) {
    if (updateError.code === "23505") {
      return {
        data: null,
        fieldErrors: {
          name: "Eine Gruppe mit diesem Namen existiert bereits in dieser Kategorie.",
        },
      };
    }
    return { ...empty, error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }

  // 2. Propagate changes to all linked items if there are key changes.
  if (addedKeys.length > 0 || removedKeys.length > 0) {
    const { data: linkedItems, error: itemsError } = await supabase
      .from("items")
      .select("id, metadata")
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    if (!itemsError && linkedItems && linkedItems.length > 0) {
      const updates = linkedItems.map((item) => {
        const meta = (item.metadata as Record<string, string>) ?? {};
        const updated = { ...meta };

        for (const key of addedKeys) {
          if (!(key in updated)) updated[key] = "";
        }

        for (const key of removedKeys) {
          const decision = removedKeysDecision[key] ?? "delete";
          if (decision === "delete") {
            delete updated[key];
          }
          // "keep" → leave existing value as orphaned (no change)
        }

        return supabase
          .from("items")
          .update({ metadata: updated })
          .eq("id", item.id)
          .eq("user_id", user.id);
      });

      await Promise.all(updates);
    }
  }

  revalidatePath("/garage/groups");
  revalidatePath(`/garage/groups/${groupId}/edit`);
  revalidatePath(`/garage/groups/${groupId}/compare`);
  redirect("/garage/groups");
}

// ---------------------------------------------------------------------------
// deleteGroupAction
// ---------------------------------------------------------------------------

export async function deleteGroupAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id || !isValidGroupId(id)) {
    revalidatePath("/garage/groups");
    redirect("/garage/groups");
  }

  const { supabase, user } = await requireUser();

  // ON DELETE SET NULL in the migration handles unlinking items automatically.
  await supabase
    .from("item_groups")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/", "layout");
  redirect("/garage/groups");
}
