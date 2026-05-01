export type SupabaseStatus = "connected" | "offline" | "not_configured";

export async function probeSupabase(timeoutMs = 1500): Promise<SupabaseStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "not_configured";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    return res.ok ? "connected" : "offline";
  } catch {
    return "offline";
  } finally {
    clearTimeout(timer);
  }
}
