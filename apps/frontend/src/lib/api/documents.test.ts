import { describe, it, expect, vi, beforeEach } from "vitest";
import * as documentsApi from "./documents";

const mockFetch = vi.fn();
vi.mock("./auth-fetch", () => ({
  authFetch: (path: string, init?: RequestInit) => mockFetch(path, init),
}));

beforeEach(() => {
  mockFetch.mockReset();
});

describe("listContents", () => {
  it("should call correct URL with encoded path", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ folders: [], files: [] }) });
    await documentsApi.listContents("Verbali/2024");
    expect(mockFetch).toHaveBeenCalledWith("/documents/browse?path=Verbali%2F2024", undefined);
  });

  it("should throw on error response", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({ error: "Non trovato" }) });
    await expect(documentsApi.listContents("bad")).rejects.toThrow("Non trovato");
  });

  it("should use default error message when body has no error field", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(documentsApi.listContents("")).rejects.toThrow("Errore nel caricamento dei documenti");
  });
});

describe("createFolder", () => {
  it("should POST with correct body", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ path: "Verbali", name: "Verbali", lastModified: "" }) });
    await documentsApi.createFolder("", "Verbali");
    expect(mockFetch).toHaveBeenCalledWith(
      "/documents/folders",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ path: "", name: "Verbali" }) })
    );
  });

  it("should throw on failure", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: "Esiste già" }) });
    await expect(documentsApi.createFolder("", "Dup")).rejects.toThrow("Esiste già");
  });
});

describe("renameFolder", () => {
  it("should PUT with correct body", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ path: "NewName", name: "NewName", lastModified: "" }) });
    await documentsApi.renameFolder("OldName", "NewName");
    expect(mockFetch).toHaveBeenCalledWith(
      "/documents/folders",
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ path: "OldName", name: "NewName" }) })
    );
  });

  it("should throw on failure", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: "Conflitto" }) });
    await expect(documentsApi.renameFolder("A", "B")).rejects.toThrow("Conflitto");
  });
});

describe("moveFolder", () => {
  it("should PUT to folders/move with correct body", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ path: "Target/Source", name: "Source", lastModified: "" }) });
    await documentsApi.moveFolder("Source", "Target");
    expect(mockFetch).toHaveBeenCalledWith(
      "/documents/folders/move",
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ path: "Source", targetPath: "Target" }) })
    );
  });
});

describe("deleteFolder", () => {
  it("should DELETE with encoded path", async () => {
    mockFetch.mockResolvedValue({ ok: true });
    await documentsApi.deleteFolder("My Folder/Sub");
    expect(mockFetch).toHaveBeenCalledWith(
      "/documents/folders?path=My%20Folder%2FSub",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("should throw on failure", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({ error: "Non trovata" }) });
    await expect(documentsApi.deleteFolder("missing")).rejects.toThrow("Non trovata");
  });
});

describe("uploadFiles", () => {
  it("should POST form data to correct URL", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => [] });
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    await documentsApi.uploadFiles("SomeFolder", [file]);
    expect(mockFetch).toHaveBeenCalledWith(
      "/documents/files?path=SomeFolder",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("should throw on failure", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: "File esiste" }) });
    const file = new File(["x"], "a.txt");
    await expect(documentsApi.uploadFiles("", [file])).rejects.toThrow("File esiste");
  });
});

describe("renameFile", () => {
  it("should PUT with correct body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ path: "new.txt", name: "new.txt", size: 0, mimeType: "text/plain", lastModified: "" }),
    });
    await documentsApi.renameFile("old.txt", "new.txt");
    expect(mockFetch).toHaveBeenCalledWith(
      "/documents/files",
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ path: "old.txt", name: "new.txt" }) })
    );
  });
});

describe("moveFile", () => {
  it("should PUT to files/move with correct body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ path: "Target/file.txt", name: "file.txt", size: 0, mimeType: "text/plain", lastModified: "" }),
    });
    await documentsApi.moveFile("file.txt", "Target");
    expect(mockFetch).toHaveBeenCalledWith(
      "/documents/files/move",
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ path: "file.txt", targetPath: "Target" }) })
    );
  });
});

describe("deleteFile", () => {
  it("should DELETE with encoded path", async () => {
    mockFetch.mockResolvedValue({ ok: true });
    await documentsApi.deleteFile("Verbali/test.pdf");
    expect(mockFetch).toHaveBeenCalledWith(
      "/documents/files?path=Verbali%2Ftest.pdf",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("should throw on failure", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({ error: "File non trovato" }) });
    await expect(documentsApi.deleteFile("missing.txt")).rejects.toThrow("File non trovato");
  });
});

describe("bulkDeleteFiles", () => {
  it("should POST paths list", async () => {
    mockFetch.mockResolvedValue({ ok: true });
    await documentsApi.bulkDeleteFiles(["a.txt", "b.txt"]);
    expect(mockFetch).toHaveBeenCalledWith(
      "/documents/files/bulk-delete",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ paths: ["a.txt", "b.txt"] }) })
    );
  });

  it("should throw on failure", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(documentsApi.bulkDeleteFiles(["a.txt"])).rejects.toThrow("Errore nell'eliminazione dei file selezionati");
  });
});

describe("bulkMoveFiles", () => {
  it("should POST paths and targetPath", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ moved: 2, failed: [] }) });
    await documentsApi.bulkMoveFiles(["a.txt"], "Archive");
    expect(mockFetch).toHaveBeenCalledWith(
      "/documents/files/bulk-move",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ paths: ["a.txt"], targetPath: "Archive" }) })
    );
  });

  it("should throw on failure", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(documentsApi.bulkMoveFiles(["a.txt"], "X")).rejects.toThrow("Errore nello spostamento dei file selezionati");
  });
});

describe("bulkDownloadFiles", () => {
  it("should POST paths list", async () => {
    const mockBlob = new Blob(["data"]);
    const mockCreateObjectURL = vi.fn().mockReturnValue("blob:url");
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    const mockClick = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValueOnce({ href: "", download: "", click: mockClick } as unknown as HTMLAnchorElement);

    mockFetch.mockResolvedValue({ ok: true, blob: async () => mockBlob });
    await documentsApi.bulkDownloadFiles(["a.txt", "b.txt"]);
    expect(mockFetch).toHaveBeenCalledWith(
      "/documents/files/bulk-download",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ paths: ["a.txt", "b.txt"] }) })
    );
    expect(mockClick).toHaveBeenCalled();
  });

  it("should throw on failure", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(documentsApi.bulkDownloadFiles(["a.txt"])).rejects.toThrow("Errore nel download dei file selezionati");
  });
});
