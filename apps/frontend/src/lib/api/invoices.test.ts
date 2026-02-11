import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth-fetch before importing the module under test
vi.mock("./auth-fetch", () => ({
  authFetch: vi.fn(),
}));

vi.mock("./auth", () => ({
  getToken: vi.fn(() => "test-token"),
}));

import {
  fetchInvoices,
  fetchInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  uploadCsv,
  uploadInvoiceFiles,
  getAttachmentUrl,
} from "./invoices";
import { authFetch } from "./auth-fetch";
import { getToken } from "./auth";
import type { Invoice, InvoiceFormData, ImportResult } from "@/types";

const mockAuthFetch = vi.mocked(authFetch);
const mockGetToken = vi.mocked(getToken);

const sampleInvoice: Invoice = {
  id: "inv-1",
  documentType: "Fattura",
  invoiceNumber: "1/2024",
  date: "2024-01-15",
  supplier: { id: "s1", name: "Test SRL", vatNumber: "IT12345678901", invoiceCount: 1 },
  taxableAmount: 100,
  taxAmount: 22,
  totalAmount: 122,
  sdiNumber: "123456",
  viewed: false,
  lineItems: [],
  attachments: [],
};

const sampleFormData: InvoiceFormData = {
  documentType: "Fattura",
  invoiceNumber: "1/2024",
  date: "2024-01-15",
  supplierName: "Test SRL",
  supplierVatNumber: "IT12345678901",
  taxableAmount: 100,
  taxAmount: 22,
  sdiNumber: "123456",
  viewed: false,
};

function jsonResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response;
}

describe("invoices API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchInvoices", () => {
    it("should return list of invoices", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse([sampleInvoice]));
      const result = await fetchInvoices();
      expect(mockAuthFetch).toHaveBeenCalledWith("/invoices");
      expect(result).toEqual([sampleInvoice]);
    });

    it("should throw on error response", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(null, false, 500));
      await expect(fetchInvoices()).rejects.toThrow("Errore nel caricamento delle fatture");
    });
  });

  describe("fetchInvoice", () => {
    it("should return a single invoice", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(sampleInvoice));
      const result = await fetchInvoice("inv-1");
      expect(mockAuthFetch).toHaveBeenCalledWith("/invoices/inv-1");
      expect(result).toEqual(sampleInvoice);
    });

    it("should throw when not found", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(null, false, 404));
      await expect(fetchInvoice("xxx")).rejects.toThrow("Fattura non trovata");
    });
  });

  describe("createInvoice", () => {
    it("should send POST and return created invoice", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(sampleInvoice));
      const result = await createInvoice(sampleFormData);
      expect(mockAuthFetch).toHaveBeenCalledWith("/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleFormData),
      });
      expect(result).toEqual(sampleInvoice);
    });

    it("should throw on error", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(null, false, 400));
      await expect(createInvoice(sampleFormData)).rejects.toThrow(
        "Errore nella creazione della fattura"
      );
    });
  });

  describe("updateInvoice", () => {
    it("should send PUT and return updated invoice", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(sampleInvoice));
      const result = await updateInvoice("inv-1", sampleFormData);
      expect(mockAuthFetch).toHaveBeenCalledWith("/invoices/inv-1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sampleFormData),
      });
      expect(result).toEqual(sampleInvoice);
    });

    it("should throw on error", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(null, false, 500));
      await expect(updateInvoice("inv-1", sampleFormData)).rejects.toThrow(
        "Errore nell'aggiornamento della fattura"
      );
    });
  });

  describe("deleteInvoice", () => {
    it("should send DELETE", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(null, true, 204));
      await deleteInvoice("inv-1");
      expect(mockAuthFetch).toHaveBeenCalledWith("/invoices/inv-1", {
        method: "DELETE",
      });
    });

    it("should throw on error", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(null, false, 500));
      await expect(deleteInvoice("inv-1")).rejects.toThrow(
        "Errore nell'eliminazione della fattura"
      );
    });
  });

  describe("uploadCsv", () => {
    it("should send files via FormData", async () => {
      const importResult: ImportResult = { imported: 5, updated: 0, skipped: 1 };
      mockAuthFetch.mockResolvedValue(jsonResponse(importResult));

      const file1 = new File(["a,b,c"], "test.csv", { type: "text/csv" });
      const file2 = new File(["d,e,f"], "test2.csv", { type: "text/csv" });
      const result = await uploadCsv([file1, file2]);

      expect(mockAuthFetch).toHaveBeenCalledWith("/invoices/upload/csv", {
        method: "POST",
        body: expect.any(FormData),
      });
      expect(result).toEqual(importResult);
    });

    it("should throw on error", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(null, false, 500));
      await expect(uploadCsv([new File(["x"], "t.csv")])).rejects.toThrow(
        "Errore nel caricamento del CSV"
      );
    });
  });

  describe("uploadInvoiceFiles", () => {
    it("should send files via FormData", async () => {
      const importResult: ImportResult = { imported: 2, updated: 1, skipped: 0 };
      mockAuthFetch.mockResolvedValue(jsonResponse(importResult));

      const file = new File(["<xml/>"], "invoice.xml", { type: "application/xml" });
      const result = await uploadInvoiceFiles([file]);

      expect(mockAuthFetch).toHaveBeenCalledWith("/invoices/upload/invoice", {
        method: "POST",
        body: expect.any(FormData),
      });
      expect(result).toEqual(importResult);
    });

    it("should throw on error", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(null, false, 500));
      await expect(
        uploadInvoiceFiles([new File(["x"], "f.xml")])
      ).rejects.toThrow("Errore nel caricamento delle fatture");
    });
  });

  describe("getAttachmentUrl", () => {
    it("should include token in query param", () => {
      mockGetToken.mockReturnValue("my-token");
      const url = getAttachmentUrl("inv-1", "att-1");
      expect(url).toContain("/invoices/inv-1/attachments/att-1");
      expect(url).toContain("token=my-token");
    });

    it("should return URL without token when no token", () => {
      mockGetToken.mockReturnValue(null);
      const url = getAttachmentUrl("inv-1", "att-1");
      expect(url).toContain("/invoices/inv-1/attachments/att-1");
      expect(url).not.toContain("token=");
    });
  });
});
