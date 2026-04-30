"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AuthFormState } from "./schema";

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

function validate(email: string, password: string): string | null {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Bitte eine gültige E-Mail-Adresse angeben.";
  }
  if (password.length < 8) {
    return "Das Passwort muss mindestens 8 Zeichen lang sein.";
  }
  return null;
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const { email, password } = readCredentials(formData);
  const validationError = validate(email, password);
  if (validationError) return { error: validationError };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Anmeldung fehlgeschlagen: ungültige Zugangsdaten." };
  }

  redirect("/");
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const { email, password } = readCredentials(formData);
  const validationError = validate(email, password);
  if (validationError) return { error: validationError };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000") +
        "/auth/callback"
    }
  });

  if (error) {
    return { error: "Registrierung fehlgeschlagen: " + error.message };
  }

  // Keine Session = E-Mail-Bestätigung ist aktiv
  if (!data.session) {
    return {
      notice:
        "Registrierung erfolgreich. Bitte bestätige den Link in deiner E-Mail."
    };
  }

  redirect("/");
}
