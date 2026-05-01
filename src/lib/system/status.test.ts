import { describe, it, expect, vi, afterEach } from "vitest";
import { probeSupabase } from "./status";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("probeSupabase", () => {
  it('returns "not_configured" when NEXT_PUBLIC_SUPABASE_URL is not set', async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const status = await probeSupabase();
    expect(status).toBe("not_configured");
  });

  it('returns "connected" when health endpoint responds ok', async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const status = await probeSupabase();
    expect(status).toBe("connected");
  });

  it('returns "offline" when health endpoint responds with non-ok status', async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const status = await probeSupabase();
    expect(status).toBe("offline");
  });

  it('returns "offline" when fetch throws (network error)', async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
    const status = await probeSupabase();
    expect(status).toBe("offline");
  });

  it('returns "offline" when fetch is aborted (timeout)', async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    const abortError = new DOMException("aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError));
    const status = await probeSupabase();
    expect(status).toBe("offline");
  });

  it("probes the correct health endpoint URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://myproject.supabase.co");
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);
    await probeSupabase();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://myproject.supabase.co/auth/v1/health",
      expect.objectContaining({ cache: "no-store" })
    );
  });
});
