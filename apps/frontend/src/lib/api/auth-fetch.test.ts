import { describe, it, expect, beforeEach, vi } from "vitest";
import { authFetch } from "./auth-fetch";
import * as authModule from "./auth";

describe("authFetch", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("should add Authorization header when token exists", async () => {
    vi.spyOn(authModule, "getToken").mockReturnValue("my-token");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 })
    );

    await authFetch("/invoices");

    const calledHeaders = fetchSpy.mock.calls[0][1]?.headers as Headers;
    expect(calledHeaders.get("Authorization")).toBe("Bearer my-token");
  });

  it("should not add Authorization header when no token", async () => {
    vi.spyOn(authModule, "getToken").mockReturnValue(null);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 })
    );

    await authFetch("/invoices");

    const calledHeaders = fetchSpy.mock.calls[0][1]?.headers as Headers;
    expect(calledHeaders.has("Authorization")).toBe(false);
  });

  it("should return the response on success", async () => {
    vi.spyOn(authModule, "getToken").mockReturnValue("token");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "1" }), { status: 200 })
    );

    const res = await authFetch("/invoices/1");
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.id).toBe("1");
  });

  it("should throw and clear token on 401 response", async () => {
    vi.spyOn(authModule, "getToken").mockReturnValue("expired-token");
    const clearSpy = vi.spyOn(authModule, "clearToken").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    );

    // Mock window.location
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...originalLocation, href: "" },
    });

    await expect(authFetch("/invoices")).rejects.toThrow("Sessione scaduta");
    expect(clearSpy).toHaveBeenCalled();
    expect(window.location.href).toBe("/login");

    // Restore
    Object.defineProperty(window, "location", {
      writable: true,
      value: originalLocation,
    });
  });

  it("should merge custom headers with auth header", async () => {
    vi.spyOn(authModule, "getToken").mockReturnValue("my-token");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("{}", { status: 200 })
    );

    await authFetch("/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const calledHeaders = fetchSpy.mock.calls[0][1]?.headers as Headers;
    expect(calledHeaders.get("Authorization")).toBe("Bearer my-token");
    expect(calledHeaders.get("Content-Type")).toBe("application/json");
  });
});
