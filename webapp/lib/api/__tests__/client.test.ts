import { describe, expect, it, vi } from "vitest";

import { apiFetch } from "../client";

const refreshAccessTokenMock = vi.hoisted(() => vi.fn().mockResolvedValue("new-token"));

vi.mock("../../auth/session-client", () => {
  return {
    refreshAccessToken: refreshAccessTokenMock,
    getBackendBaseUrl: () => "https://api.example.test",
  };
});

vi.mock("../../hooks/use-auth-token", () => ({
  getAuthTokenSync: () => "initial-token",
}));

describe("apiFetch", () => {
  it("reuses single refresh when multiple requests hit 401", async () => {
    window.localStorage.setItem("refresh_token", "refresh-token");
    const fetchMock = vi
      .spyOn(global, "fetch")
      // first call -> 401
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      // retry after refresh
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } }))
      // second request shares refresh result
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } }));

    const first = apiFetch("/api/v1/test", { method: "GET" });
    const second = apiFetch("/api/v1/test", { method: "GET" });

    await Promise.all([first, second]);

    // Three calls total (one original succeeds after refresh, the second piggybacks on refreshed token)
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(refreshAccessTokenMock).toHaveBeenCalledTimes(1);
  });
});
