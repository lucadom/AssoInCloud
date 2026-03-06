import { describe, expect, it, vi } from "vitest";
import {
  fetchPecFolders,
  fetchPecMessages,
  fetchPecMessage,
  setPecReadStatus,
  getPecAttachmentUrl,
  getPecAttachmentPreviewUrl,
  fetchPecAttachmentAsInvoice,
  importPecAttachmentAsInvoice,
  isPecNotConfiguredError,
} from "./pec";
import { authFetch } from "./auth-fetch";
import { getToken } from "./auth";

vi.mock("./auth-fetch", () => ({
  authFetch: vi.fn(),
}));

vi.mock("./auth", () => ({
  getToken: vi.fn().mockReturnValue("test-token"),
}));

const mockAuthFetch = vi.mocked(authFetch);
const mockGetToken = vi.mocked(getToken);

describe("isPecNotConfiguredError", () => {
  it("should return true for errors with notConfigured=true", () => {
    const err = new Error("test") as Error & { notConfigured: boolean };
    err.notConfigured = true;
    expect(isPecNotConfiguredError(err)).toBe(true);
  });

  it("should return false for regular errors", () => {
    expect(isPecNotConfiguredError(new Error("regular"))).toBe(false);
  });

  it("should return false for non-error values", () => {
    expect(isPecNotConfiguredError("string")).toBe(false);
    expect(isPecNotConfiguredError(null)).toBe(false);
  });
});

describe("fetchPecFolders", () => {
  it("should return folders on success", async () => {
    const folders = [{ name: "INBOX", fullName: "INBOX", unreadCount: 0 }];
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(folders), { status: 200 })
    );
    const result = await fetchPecFolders();
    expect(result).toEqual(folders);
    expect(mockAuthFetch).toHaveBeenCalledWith("/pec/folders");
  });

  it("should throw PecNotConfiguredError on 404", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "PEC non configurata" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    );
    await expect(fetchPecFolders()).rejects.toMatchObject({
      notConfigured: true,
      message: "PEC non configurata",
    });
  });

  it("should throw PecNotConfiguredError with fallback message on 404 with empty body", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response("bad-json", { status: 404 })
    );
    await expect(fetchPecFolders()).rejects.toMatchObject({
      notConfigured: true,
    });
  });

  it("should throw generic error on other error status", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    await expect(fetchPecFolders()).rejects.toThrow(
      "Errore nel caricamento delle cartelle PEC"
    );
  });
});

describe("fetchPecMessages", () => {
  it("should return messages with default pagination", async () => {
    const messages = [{ uid: 1, subject: "Test" }];
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(messages), { status: 200 })
    );
    const result = await fetchPecMessages("INBOX");
    expect(result).toEqual(messages);
    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining("/pec/messages?")
    );
  });

  it("should include custom page and size", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([]), { status: 200 })
    );
    await fetchPecMessages("INBOX", 2, 10);
    const url = mockAuthFetch.mock.lastCall![0] as string;
    expect(url).toContain("page=2");
    expect(url).toContain("size=10");
  });

  it("should throw on error", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    await expect(fetchPecMessages("INBOX")).rejects.toThrow(
      "Errore nel caricamento dei messaggi"
    );
  });
});

describe("fetchPecMessage", () => {
  it("should return message on success", async () => {
    const msg = { uid: 42, subject: "Hello" };
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(msg), { status: 200 })
    );
    const result = await fetchPecMessage("INBOX", 42);
    expect(result).toEqual(msg);
    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining("/pec/messages/42")
    );
  });

  it("should set envelope param when envelope=true", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );
    await fetchPecMessage("INBOX", 1, true);
    const url = mockAuthFetch.mock.lastCall![0] as string;
    expect(url).toContain("envelope=true");
  });

  it("should throw on error", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    await expect(fetchPecMessage("INBOX", 1)).rejects.toThrow(
      "Errore nel caricamento del messaggio"
    );
  });
});

describe("setPecReadStatus", () => {
  it("should succeed on 200", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));
    await expect(setPecReadStatus("INBOX", 1, true)).resolves.toBeUndefined();
    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining("/pec/messages/1"),
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("should throw on error with body message", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Errore flag" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );
    await expect(setPecReadStatus("INBOX", 1, false)).rejects.toThrow("Errore flag");
  });

  it("should throw fallback on empty body", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("bad", { status: 500 }));
    await expect(setPecReadStatus("INBOX", 1, false)).rejects.toThrow(
      "Errore nell'aggiornamento dello stato"
    );
  });
});

describe("getPecAttachmentUrl", () => {
  it("should include token and folder params", () => {
    mockGetToken.mockReturnValue("my-token");
    const url = getPecAttachmentUrl("INBOX", 5, 0);
    expect(url).toContain("/pec/attachments/5/0");
    expect(url).toContain("token=my-token");
    expect(url).toContain("folder=INBOX");
  });

  it("should set envelope param when true", () => {
    const url = getPecAttachmentUrl("INBOX", 5, 0, true);
    expect(url).toContain("envelope=true");
  });

  it("should work with null token", () => {
    mockGetToken.mockReturnValue(null);
    const url = getPecAttachmentUrl("INBOX", 5, 0);
    expect(url).not.toContain("token=");
  });
});

describe("getPecAttachmentPreviewUrl", () => {
  it("should include inline=true", () => {
    mockGetToken.mockReturnValue("tok");
    const url = getPecAttachmentPreviewUrl("INBOX", 3, 1);
    expect(url).toContain("inline=true");
    expect(url).toContain("/pec/attachments/3/1");
  });

  it("should set envelope param when true", () => {
    const url = getPecAttachmentPreviewUrl("INBOX", 3, 1, true);
    expect(url).toContain("envelope=true");
  });
});

describe("fetchPecAttachmentAsInvoice", () => {
  it("should return invoice on success", async () => {
    const invoice = { id: "inv1", invoiceNumber: "FT/001" };
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(invoice), { status: 200 })
    );
    const result = await fetchPecAttachmentAsInvoice("INBOX", 10, 0);
    expect(result).toEqual(invoice);
    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining("/pec/attachments/10/0/preview-as-invoice")
    );
  });

  it("should set envelope param when true", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );
    await fetchPecAttachmentAsInvoice("INBOX", 10, 0, true);
    const url = mockAuthFetch.mock.lastCall![0] as string;
    expect(url).toContain("envelope=true");
  });

  it("should throw error message from body", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "XML non valido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );
    await expect(fetchPecAttachmentAsInvoice("INBOX", 1, 0)).rejects.toThrow(
      "XML non valido"
    );
  });

  it("should throw fallback on empty body error", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("bad", { status: 400 }));
    await expect(fetchPecAttachmentAsInvoice("INBOX", 1, 0)).rejects.toThrow(
      "Impossibile analizzare il file come fattura"
    );
  });
});

describe("importPecAttachmentAsInvoice", () => {
  it("should return import result on success", async () => {
    const result = { imported: 1, updated: 0, skipped: 0 };
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(result), { status: 200 })
    );
    const res = await importPecAttachmentAsInvoice("INBOX", 10, 0);
    expect(res).toEqual(result);
    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining("/pec/attachments/10/0/import-as-invoice"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("should set envelope param when true", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ imported: 0, updated: 1, skipped: 0 }), { status: 200 })
    );
    await importPecAttachmentAsInvoice("INBOX", 10, 0, true);
    const url = mockAuthFetch.mock.lastCall![0] as string;
    expect(url).toContain("envelope=true");
  });

  it("should throw error from body", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Importazione fallita" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );
    await expect(importPecAttachmentAsInvoice("INBOX", 1, 0)).rejects.toThrow(
      "Importazione fallita"
    );
  });

  it("should throw fallback on empty body error", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("bad", { status: 500 }));
    await expect(importPecAttachmentAsInvoice("INBOX", 1, 0)).rejects.toThrow(
      "Impossibile importare la fattura"
    );
  });
});
