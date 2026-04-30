"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createProfileSchema, type OnboardingFormState } from "./schema";

export async function createProfileAction(
  _prev: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  const raw = {
    username: String(formData.get("username") ?? "").trim(),
    full_name: String(formData.get("full_name") ?? "").trim() || undefined,
    is_public: formData.get("is_public") === "on",
  };

  const parsed = createProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: OnboardingFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof typeof fieldErrors;
      if (field === "username" || field === "full_name") {
        fieldErrors[field] = issue.message;
      }
    }
    return { fieldErrors };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    username: parsed.data.username,
    full_name: parsed.data.full_name ?? null,
    is_public: parsed.data.is_public,
  });

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { username: "Dieser Benutzername ist bereits vergeben." } };
    }
    return { error: "Profil konnte nicht angelegt werden. Bitte erneut versuchen." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
