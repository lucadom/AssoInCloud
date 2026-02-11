import { describe, it, expect, beforeEach, vi } from "vitest";
import { setToken, getToken, clearToken, login, logout, fetchAuthStatus } from "./auth";

describe("auth token management", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "assoincloud_token=; path=/; max-age=0";
  });

  it("setToken should store token in localStorage", () => {
    setToken("test-token-123");
    expect(localStorage.getItem("assoincloud_token")).toBe("test-token-123");
  });

  it("getToken should return stored token", () => {
    localStorage.setItem("assoincloud_token", "my-token");
    expect(getToken()).toBe("my-token");
  });

  it("getToken should return null when no token is stored", () => {
    expect(getToken()).toBeNull();
  });

  it("clearToken should remove token from localStorage", () => {
    localStorage.setItem("assoincloud_token", "to-remove");
    clearToken();
    expect(localStorage.getItem("assoincloud_token")).toBeNull();
  });

  it("setToken should set a cookie", () => {
    setToken("cookie-token");
    expect(document.cookie).toContain("assoincloud_token=cookie-token");
  });

  it("clearToken should clear the cookie", () => {
    setToken("cookie-token");
    clearToken();
    expect(document.cookie).not.toContain("cookie-token");
  });
});

describe("fetchAuthStatus", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return authEnabled status from backend", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ authEnabled: true }), { status: 200 })
    );

    const result = await fetchAuthStatus();
    expect(result).toEqual({ authEnabled: true });
  });

  it("should throw on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("error", { status: 500 })
    );

    await expect(fetchAuthStatus()).rejects.toThrow(
      "Errore nel controllo dello stato di autenticazione"
    );
  });
});

describe("login", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("should store token on successful login", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ token: "new-token-abc" }), { status: 200 })
    );

    const token = await login("correct-password");
    expect(token).toBe("new-token-abc");
    expect(getToken()).toBe("new-token-abc");
  });

  it("should throw on 401 (wrong password)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Password non valida" }), { status: 401 })
    );

    await expect(login("wrong")).rejects.toThrow("Password non valida");
  });
});

describe("logout", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("should clear token and call backend logout", async () => {
    setToken("active-token");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 200 })
    );

    await logout();

    expect(getToken()).toBeNull();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/auth/logout"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("should clear token even if no token exists", async () => {
    await logout();
    expect(getToken()).toBeNull();
  });
});
