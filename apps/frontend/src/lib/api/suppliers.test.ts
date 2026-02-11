import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./auth-fetch", () => ({
  authFetch: vi.fn(),
}));

import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "./suppliers";
import { authFetch } from "./auth-fetch";
import type { Supplier, SupplierFormData } from "@/types";

const mockAuthFetch = vi.mocked(authFetch);

const sampleSupplier: Supplier = {
  id: "s1",
  name: "Test SRL",
  vatNumber: "IT12345678901",
  invoiceCount: 3,
};

const formData: SupplierFormData = {
  name: "Test SRL",
  vatNumber: "IT12345678901",
};

function jsonResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response;
}

describe("suppliers API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchSuppliers", () => {
    it("should return list of suppliers", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse([sampleSupplier]));
      const result = await fetchSuppliers();
      expect(mockAuthFetch).toHaveBeenCalledWith("/suppliers");
      expect(result).toEqual([sampleSupplier]);
    });

    it("should throw on error response", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(null, false, 500));
      await expect(fetchSuppliers()).rejects.toThrow(
        "Errore nel caricamento dei fornitori"
      );
    });
  });

  describe("createSupplier", () => {
    it("should send POST and return created supplier", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(sampleSupplier));
      const result = await createSupplier(formData);
      expect(mockAuthFetch).toHaveBeenCalledWith("/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      expect(result).toEqual(sampleSupplier);
    });

    it("should throw with backend error message", async () => {
      mockAuthFetch.mockResolvedValue(
        jsonResponse({ error: "Partita IVA già esistente" }, false, 409)
      );
      await expect(createSupplier(formData)).rejects.toThrow(
        "Partita IVA già esistente"
      );
    });

    it("should throw default message when no error body", async () => {
      const res = {
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("parse error")),
      } as unknown as Response;
      mockAuthFetch.mockResolvedValue(res);
      await expect(createSupplier(formData)).rejects.toThrow(
        "Errore nella creazione del fornitore"
      );
    });
  });

  describe("updateSupplier", () => {
    it("should send PUT and return updated supplier", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(sampleSupplier));
      const result = await updateSupplier("s1", formData);
      expect(mockAuthFetch).toHaveBeenCalledWith("/suppliers/s1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      expect(result).toEqual(sampleSupplier);
    });

    it("should throw with backend error message", async () => {
      mockAuthFetch.mockResolvedValue(
        jsonResponse({ error: "Conflitto" }, false, 409)
      );
      await expect(updateSupplier("s1", formData)).rejects.toThrow("Conflitto");
    });

    it("should throw default message when no error body", async () => {
      const res = {
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("parse error")),
      } as unknown as Response;
      mockAuthFetch.mockResolvedValue(res);
      await expect(updateSupplier("s1", formData)).rejects.toThrow(
        "Errore nell'aggiornamento del fornitore"
      );
    });
  });

  describe("deleteSupplier", () => {
    it("should send DELETE", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(null, true, 204));
      await deleteSupplier("s1");
      expect(mockAuthFetch).toHaveBeenCalledWith("/suppliers/s1", {
        method: "DELETE",
      });
    });

    it("should throw with backend error message", async () => {
      mockAuthFetch.mockResolvedValue(
        jsonResponse({ error: "Ha fatture associate" }, false, 409)
      );
      await expect(deleteSupplier("s1")).rejects.toThrow("Ha fatture associate");
    });

    it("should throw default message when no error body", async () => {
      const res = {
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("parse error")),
      } as unknown as Response;
      mockAuthFetch.mockResolvedValue(res);
      await expect(deleteSupplier("s1")).rejects.toThrow(
        "Errore nell'eliminazione del fornitore"
      );
    });
  });
});
