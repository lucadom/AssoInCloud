import { describe, it, expect, vi, beforeEach } from "vitest";
import { authFetch } from "./auth-fetch";
import { fetchPriceList } from "./price-lists";

vi.mock("./auth-fetch", () => ({
  authFetch: vi.fn(),
}));

const mockAuthFetch = vi.mocked(authFetch);

describe("fetchPriceList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
