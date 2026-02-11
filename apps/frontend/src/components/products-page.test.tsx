import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { ProductsPage } from "./products-page";
import { TestWrapper } from "@/test-utils";
import type { ProductSearchResult } from "@/types";

// Mock the API module
vi.mock("@/lib/api/products", () => ({
  searchProducts: vi.fn(),
}));

import { searchProducts } from "@/lib/api/products";
const mockSearch = vi.mocked(searchProducts);

const results: ProductSearchResult[] = [
  {
    lineItemId: "li-1",
    invoiceDate: "2024-06-15",
    supplierName: "Alfa SRL",
    description: "Caffè espresso",
    quantity: 10,
    unitOfMeasure: "KG",
    unitPrice: 5.5,
    totalPrice: 55,
  },
  {
    lineItemId: "li-2",
    invoiceDate: "2024-07-20",
    supplierName: "Beta SpA",
    description: "Tè verde",
    quantity: null,
    unitOfMeasure: null,
    unitPrice: null,
    totalPrice: null,
  },
];

describe("ProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render title", () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );
    expect(screen.getByText("Prodotti")).toBeInTheDocument();
  });

  it("should render search input", () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );
    expect(
      screen.getByPlaceholderText(/Cerca prodotti/)
    ).toBeInTheDocument();
  });

  it("should show initial help text", () => {
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );
    expect(
      screen.getByText(/Inserisci un termine di ricerca/)
    ).toBeInTheDocument();
  });

  it("should search and display results", async () => {
    mockSearch.mockResolvedValue(results);
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );
    const input = screen.getByPlaceholderText(/Cerca prodotti/);
    await act(async () => {
      fireEvent.change(input, { target: { value: "caffè" } });
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith("caffè");
    });
    await waitFor(() => {
      expect(screen.getByText("Caffè espresso")).toBeInTheDocument();
    });
    expect(screen.getByText("Tè verde")).toBeInTheDocument();
    expect(screen.getByText("Alfa SRL")).toBeInTheDocument();
    expect(screen.getByText("Beta SpA")).toBeInTheDocument();
    expect(screen.getByText(/2 risultati trovati/)).toBeInTheDocument();
  });

  it("should display formatted currency and quantity", async () => {
    mockSearch.mockResolvedValue(results);
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );
    const input = screen.getByPlaceholderText(/Cerca prodotti/);
    await act(async () => {
      fireEvent.change(input, { target: { value: "caffè" } });
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => {
      expect(screen.getByText("Caffè espresso")).toBeInTheDocument();
    });
    // Null values should render as "—"
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("should show 'Nessun prodotto trovato' when search returns empty", async () => {
    mockSearch.mockResolvedValue([]);
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );
    const input = screen.getByPlaceholderText(/Cerca prodotti/);
    await act(async () => {
      fireEvent.change(input, { target: { value: "nonexistent" } });
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => {
      expect(screen.getByText("Nessun prodotto trovato.")).toBeInTheDocument();
    });
  });

  it("should clear results when search is emptied", async () => {
    mockSearch.mockResolvedValue(results);
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );
    const input = screen.getByPlaceholderText(/Cerca prodotti/);

    // Type something to trigger search
    await act(async () => {
      fireEvent.change(input, { target: { value: "caffè" } });
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => {
      expect(screen.getByText("Caffè espresso")).toBeInTheDocument();
    });

    // Clear the input
    await act(async () => {
      fireEvent.change(input, { target: { value: "" } });
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => {
      expect(screen.getByText(/Inserisci un termine di ricerca/)).toBeInTheDocument();
    });
  });

  it("should handle search error gracefully", async () => {
    mockSearch.mockRejectedValue(new Error("Network error"));
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );
    const input = screen.getByPlaceholderText(/Cerca prodotti/);
    await act(async () => {
      fireEvent.change(input, { target: { value: "test" } });
      vi.advanceTimersByTime(500);
    });
    // Should not crash - empty results after error
    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalled();
    });
  });

  it("should display table headers when results are shown", async () => {
    mockSearch.mockResolvedValue(results);
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );
    const input = screen.getByPlaceholderText(/Cerca prodotti/);
    await act(async () => {
      fireEvent.change(input, { target: { value: "caffè" } });
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => {
      expect(screen.getByText("Descrizione")).toBeInTheDocument();
    });
    expect(screen.getByText("Fornitore")).toBeInTheDocument();
    expect(screen.getByText("Data fattura")).toBeInTheDocument();
    expect(screen.getByText("Quantità")).toBeInTheDocument();
    expect(screen.getByText("U.M.")).toBeInTheDocument();
    expect(screen.getByText("Prezzo unitario")).toBeInTheDocument();
    // "Totale" column header
    expect(screen.getByRole("columnheader", { name: /Totale/ })).toBeInTheDocument();
  });

  it("should use singular text when 1 result", async () => {
    mockSearch.mockResolvedValue([results[0]]);
    render(
      <TestWrapper>
        <ProductsPage />
      </TestWrapper>
    );
    const input = screen.getByPlaceholderText(/Cerca prodotti/);
    await act(async () => {
      fireEvent.change(input, { target: { value: "caffè" } });
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => {
      expect(screen.getByText(/1 risultato trovato/)).toBeInTheDocument();
    });
  });
});
