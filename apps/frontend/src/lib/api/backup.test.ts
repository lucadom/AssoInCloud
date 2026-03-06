import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  fetchCurrentVersion,
  inspectBackupFile,
  downloadBackup,
  restoreBackup,
} from "./backup";
import { authFetch } from "./auth-fetch";

vi.mock("./auth-fetch", () => ({
  authFetch: vi.fn(),
}));

const mockAuthFetch = vi.mocked(authFetch);

describe("fetchCurrentVersion", () => {
  it("should return version on success", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ version: "5" }), { status: 200 })
    );
    const result = await fetchCurrentVersion();
    expect(result).toEqual({ version: "5" });
    expect(mockAuthFetch).toHaveBeenCalledWith("/backup/version");
  });

  it("should throw on error", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    await expect(fetchCurrentVersion()).rejects.toThrow(
      "Errore nel recupero della versione del database"
    );
  });
});

describe("inspectBackupFile", () => {
  it("should return version on success", async () => {
    const file = new File(["db"], "backup.db");
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ version: "4" }), { status: 200 })
    );
    const result = await inspectBackupFile(file);
    expect(result).toEqual({ version: "4" });
    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/backup/inspect",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("should throw error message from body", async () => {
    const file = new File(["bad"], "bad.db");
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "File non valido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );
    await expect(inspectBackupFile(file)).rejects.toThrow("File non valido");
  });

  it("should throw fallback on empty body", async () => {
    const file = new File(["bad"], "bad.db");
    mockAuthFetch.mockResolvedValueOnce(
      new Response("not-json", { status: 400 })
    );
    await expect(inspectBackupFile(file)).rejects.toThrow(
      "Il file non è un database SQLite valido"
    );
  });
});

describe("downloadBackup", () => {
  beforeEach(() => {
    // jsdom does not provide URL.createObjectURL
    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn().mockReturnValue("blob:mock-url"),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
  });

  it("should create and click a download anchor", async () => {
    const blob = new Blob(["db-content"]);
    const response = new Response(blob, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="assoincloud_backup.db"',
      },
    });
    mockAuthFetch.mockResolvedValueOnce(response);

    const clickSpy = vi.fn();
    const anchorEl = { href: "", download: "", click: clickSpy } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValueOnce(anchorEl);

    await downloadBackup();

    expect(anchorEl.download).toBe("assoincloud_backup.db");
    expect(clickSpy).toHaveBeenCalled();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("should use fallback filename when header missing", async () => {
    const blob = new Blob(["db"]);
    mockAuthFetch.mockResolvedValueOnce(new Response(blob, { status: 200 }));

    const clickSpy = vi.fn();
    const anchorEl = { href: "", download: "", click: clickSpy } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockReturnValueOnce(anchorEl);

    await downloadBackup();

    expect(anchorEl.download).toBe("assoincloud_backup.db");
  });

  it("should throw on error", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    await expect(downloadBackup()).rejects.toThrow("Errore nel download del backup");
  });
});

describe("restoreBackup", () => {
  it("should succeed on 200", async () => {
    const file = new File(["db"], "backup.db");
    mockAuthFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));
    await expect(restoreBackup(file)).resolves.toBeUndefined();
    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/backup/restore",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("should throw error message from body", async () => {
    const file = new File(["db"], "backup.db");
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Database corrotto" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );
    await expect(restoreBackup(file)).rejects.toThrow("Database corrotto");
  });

  it("should throw fallback on empty body", async () => {
    const file = new File(["db"], "backup.db");
    mockAuthFetch.mockResolvedValueOnce(new Response("bad", { status: 500 }));
    await expect(restoreBackup(file)).rejects.toThrow(
      "Errore durante il ripristino del database"
    );
  });
});
