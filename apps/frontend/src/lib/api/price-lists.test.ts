import { describe, it, expect, vi, beforeEach } from "vitest";
import { authFetch } from "./auth-fetch";
import { fetchPriceList, exportPriceListXlsx, exportPriceListPdf } from "./price-lists";

vi.mock("./auth-fetch", () => ({
  authFetch: vi.fn(),
}));

const mockAuthFetch = vi.mocked(authFetch);

// jsdom does not provide URL.createObjectURL — stub it
const mockCreateObjectURL = vi.fn(() => "blob:mock-url");
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(URL, "createObjectURL", { value: mockCreateObjectURL, writable: true });
  Object.defineProperty(URL, "revokeObjectURL", { value: mockRevokeObjectURL, writable: true });
});

describe("fetchPriceList", () => {
  it("should call correct URL with supplier ID only", async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    await fetchPriceList("supplier-123");

    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/price-lists/supplier/supplier-123"
    );
  });

  it("should include from and to params when provided", async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    await fetchPriceList("supplier-123", "2024-01-01", "2024-12-31");

    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/price-lists/supplier/supplier-123?from=2024-01-01&to=2024-12-31"
    );
  });

  it("should include only from param when to is undefined", async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    await fetchPriceList("supplier-123", "2024-01-01");

    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/price-lists/supplier/supplier-123?from=2024-01-01"
    );
  });

  it("should throw on non-ok response", async () => {
    mockAuthFetch.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(fetchPriceList("supplier-123")).rejects.toThrow(
      "Errore nel caricamento del listino"
    );
  });

  it("should encode supplier ID", async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    await fetchPriceList("id with spaces");

    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/price-lists/supplier/id%20with%20spaces"
    );
  });
});

function makeExportResponse(contentDisposition?: string): Response {
  return {
    ok: true,
    blob: () => Promise.resolve(new Blob(["data"])),
    headers: { get: (h: string) => h.toLowerCase() === "content-disposition" ? (contentDisposition ?? null) : null },
  } as unknown as Response;
}

describe("exportPriceListXlsx", () => {
  it("should call correct URL with supplier ID only", async () => {
    mockAuthFetch.mockResolvedValue(makeExportResponse());

    await exportPriceListXlsx("supplier-123");

    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/price-lists/supplier/supplier-123/export-xlsx"
    );
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it("should include from and to params when provided", async () => {
    mockAuthFetch.mockResolvedValue(makeExportResponse());

    await exportPriceListXlsx("supplier-123", "2024-01-01", "2024-12-31");

    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/price-lists/supplier/supplier-123/export-xlsx?from=2024-01-01&to=2024-12-31"
    );
  });

  it("should use filename from Content-Disposition header", async () => {
    mockAuthFetch.mockResolvedValue(
      makeExportResponse('attachment; filename="listino_Acme_Srl_20240428.xlsx"')
    );
    const anchor = { href: "", download: "", click: vi.fn() };
    vi.spyOn(document, "createElement").mockReturnValueOnce(anchor as unknown as HTMLElement);

    await exportPriceListXlsx("supplier-123");

    expect(anchor.download).toBe("listino_Acme_Srl_20240428.xlsx");
  });

  it("should fall back to supplier ID when Content-Disposition is absent", async () => {
    mockAuthFetch.mockResolvedValue(makeExportResponse());
    const anchor = { href: "", download: "", click: vi.fn() };
    vi.spyOn(document, "createElement").mockReturnValueOnce(anchor as unknown as HTMLElement);

    await exportPriceListXlsx("supplier-123");

    expect(anchor.download).toBe("listino_supplier-123.xlsx");
  });

  it("should throw on non-ok response", async () => {
    mockAuthFetch.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(exportPriceListXlsx("supplier-123")).rejects.toThrow(
      "Errore nell'esportazione del listino in Excel"
    );
  });
});

describe("exportPriceListPdf", () => {
  it("should call correct URL with supplier ID only", async () => {
    mockAuthFetch.mockResolvedValue(makeExportResponse());

    await exportPriceListPdf("supplier-123");

    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/price-lists/supplier/supplier-123/export-pdf"
    );
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });

  it("should include from and to params when provided", async () => {
    mockAuthFetch.mockResolvedValue(makeExportResponse());

    await exportPriceListPdf("supplier-123", "2024-01-01", "2024-12-31");

    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/price-lists/supplier/supplier-123/export-pdf?from=2024-01-01&to=2024-12-31"
    );
  });

  it("should use filename from Content-Disposition header", async () => {
    mockAuthFetch.mockResolvedValue(
      makeExportResponse('attachment; filename="listino_Acme_Srl_20240428.pdf"')
    );
    const anchor = { href: "", download: "", click: vi.fn() };
    vi.spyOn(document, "createElement").mockReturnValueOnce(anchor as unknown as HTMLElement);

    await exportPriceListPdf("supplier-123");

    expect(anchor.download).toBe("listino_Acme_Srl_20240428.pdf");
  });

  it("should fall back to supplier ID when Content-Disposition is absent", async () => {
    mockAuthFetch.mockResolvedValue(makeExportResponse());
    const anchor = { href: "", download: "", click: vi.fn() };
    vi.spyOn(document, "createElement").mockReturnValueOnce(anchor as unknown as HTMLElement);

    await exportPriceListPdf("supplier-123");

    expect(anchor.download).toBe("listino_supplier-123.pdf");
  });

  it("should throw on non-ok response", async () => {
    mockAuthFetch.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    await expect(exportPriceListPdf("supplier-123")).rejects.toThrow(
      "Errore nell'esportazione del listino in PDF"
    );
  });
});
