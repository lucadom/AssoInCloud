import { describe, expect, it, vi } from "vitest";
import { fetchPecConfig, savePecConfig } from "./settings";
import { authFetch } from "./auth-fetch";

vi.mock("./auth-fetch", () => ({
  authFetch: vi.fn(),
}));

const mockAuthFetch = vi.mocked(authFetch);

const mockConfig = {
  host: "mail.example.com",
  port: 993,
  username: "user@example.com",
  password: "",
  ssl: true,
  sslTrustAll: false,
  passwordSet: true,
};

describe("fetchPecConfig", () => {
  it("should return config on success", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockConfig), { status: 200 })
    );
    const result = await fetchPecConfig();
    expect(result).toEqual(mockConfig);
    expect(mockAuthFetch).toHaveBeenCalledWith("/settings/pec");
  });

  it("should throw on error", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    await expect(fetchPecConfig()).rejects.toThrow(
      "Errore nel caricamento della configurazione PEC"
    );
  });
});

describe("savePecConfig", () => {
  it("should return updated config on success", async () => {
    const updated = { ...mockConfig, host: "new.example.com" };
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(updated), { status: 200 })
    );
    const result = await savePecConfig(mockConfig);
    expect(result).toEqual(updated);
    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/settings/pec",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockConfig),
      })
    );
  });

  it("should throw error message from body", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Configurazione non valida" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );
    await expect(savePecConfig(mockConfig)).rejects.toThrow(
      "Configurazione non valida"
    );
  });

  it("should throw fallback error on empty body", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("bad", { status: 500 }));
    await expect(savePecConfig(mockConfig)).rejects.toThrow(
      "Errore nel salvataggio della configurazione PEC"
    );
  });
});
