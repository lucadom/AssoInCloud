import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./auth-fetch", () => ({
  authFetch: vi.fn(),
}));

import { searchProducts } from "./products";
import { authFetch } from "./auth-fetch";
import type { ProductSearchResult } from "@/types";

const mockAuthFetch = vi.mocked(authFetch);

const sampleProduct: ProductSearchResult = {
  lineItemId: "li-1",
  supplierName: "Test SRL",
  invoiceDate: "2024-01-15",
  description: "Widget A",
  quantity: 10,
  unitOfMeasure: "PZ",
  unitPrice: 5.0,
  totalPrice: 50.0,
};

function jsonResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response;
}

describe("products API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchProducts", () => {
    it("should send encoded query and return results", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse([sampleProduct]));
      const result = await searchProducts("widget a");
      expect(mockAuthFetch).toHaveBeenCalledWith(
        "/products/search?q=widget%20a"
      );
      expect(result).toEqual([sampleProduct]);
    });

    it("should handle special characters in query", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse([]));
      await searchProducts("the*limone&12");
      expect(mockAuthFetch).toHaveBeenCalledWith(
        `/products/search?q=${encodeURIComponent("the*limone&12")}`
      );
    });

    it("should throw on error response", async () => {
      mockAuthFetch.mockResolvedValue(jsonResponse(null, false, 500));
      await expect(searchProducts("test")).rejects.toThrow(
        "Errore nella ricerca dei prodotti"
      );
    });
  });
});
