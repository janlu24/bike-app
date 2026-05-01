"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  parseTemplateInput,
  parsePropagationDecisions,
  computeTemplateDiff,
  isValidTemplateId,
} from "@/lib/templates/validation";
import type { TemplateFormState } from "./schema";

const empty: TemplateFormState = { data: null, fieldErrors: {} };

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return { supabase, user };
}

// ---------------------------------------------------------------------------
// createTemplateAction
// ---------------------------------------------------------------------------

export async function createTemplateAction(
  _prev: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const parsed = parseTemplateInput(formData);
  if (!parsed.data) return parsed;

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { ...empty, error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { error } = await supabase.from("item_templates").insert({
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
          name: "Eine Vorlage mit diesem Namen existiert bereits in dieser Kategorie.",
        },
      };
    }
    return { ...empty, error: "Speichern fehlgeschlagen. Bitte erneut versuchen." };
  }

  revalidatePath("/garage/templates");
  redirect("/garage/templates");
}

// ---------------------------------------------------------------------------
// updateTemplateAction
// ---------------------------------------------------------------------------

export async function updateTemplateAction(
  templateId: string,
  _prev: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  if (!isValidTemplateId(templateId)) {
    return { ...empty, error: "Ungültige Vorlagen-ID." };
  }

  const parsed = parseTemplateInput(formData);
  if (!parsed.data) return parsed;

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  let user: { id: string };
  try {
    ({ supabase, user } = await requireUser());
  } catch {
    return { ...empty, error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  // Load current template to verify ownership and compute diff server-side.
  const { data: existing, error: fetchError } = await supabase
    .from("item_templates")
    .select("property_keys")
    .eq("id", templateId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ...empty, error: "Vorlage nicht gefunden." };
  }

  const oldKeys: string[] = existing.property_keys ?? [];
  const newKeys = parsed.data.property_keys;
  const { added: addedKeys, removed: removedKeys } = computeTemplateDiff(oldKeys, newKeys);
  const { removedKeysDecision } = parsePropagationDecisions(formData);

  // 1. Update the template itself.
  const { error: updateError } = await supabase
    .from("item_templates")
    .update({ name: parsed.data.name, property_keys: newKeys })
    .eq("id", templateId)
    .eq("user_id", user.id);

  if (updateError) {
    if (updateError.code === "23505") {
      return {
        data: null,
        fieldErrors: {
          name: "Eine Vorlage mit diesem Namen existiert bereits in dieser Kategorie.",
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
      .eq("template_id", templateId)
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

  revalidatePath("/garage/templates");
  revalidatePath(`/garage/templates/${templateId}/edit`);
  revalidatePath(`/garage/templates/${templateId}/compare`);
  redirect("/garage/templates");
}

// ---------------------------------------------------------------------------
// deleteTemplateAction
// ---------------------------------------------------------------------------

export async function deleteTemplateAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id || !isValidTemplateId(id)) {
    revalidatePath("/garage/templates");
    redirect("/garage/templates");
  }

  const { supabase, user } = await requireUser();

  // ON DELETE SET NULL in the migration handles unlinking items automatically.
  await supabase
    .from("item_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/", "layout");
  redirect("/garage/templates");
}
