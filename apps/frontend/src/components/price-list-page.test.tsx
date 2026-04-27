import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { PriceListPage } from "./price-list-page";
import { TestWrapper } from "@/test-utils";
import type { Supplier, PriceListItem } from "@/types";

// Mock the API modules
vi.mock("@/lib/api/suppliers", () => ({
  fetchSuppliers: vi.fn(),
}));

vi.mock("@/lib/api/price-lists", () => ({
  fetchPriceList: vi.fn(),
  exportPriceListXlsx: vi.fn(),
  exportPriceListPdf: vi.fn(),
}));

import { fetchSuppliers } from "@/lib/api/suppliers";
import { fetchPriceList, exportPriceListXlsx, exportPriceListPdf } from "@/lib/api/price-lists";

const mockFetchSuppliers = vi.mocked(fetchSuppliers);
const mockFetchPriceList = vi.mocked(fetchPriceList);
const mockExportXlsx = vi.mocked(exportPriceListXlsx);
const mockExportPdf = vi.mocked(exportPriceListPdf);

const suppliers: Supplier[] = [
  { id: "s1", name: "Alfa SRL", vatNumber: "IT11111111111", invoiceCount: 3 },
  { id: "s2", name: "Beta SpA", vatNumber: "IT22222222222", invoiceCount: 1 },
];

const priceListResults: PriceListItem[] = [
  {
    description: "Caffè espresso",
    unitOfMeasure: "KG",
    unitPrice: 5.5,
    lastPurchaseDate: "2024-06-20",
    totalQuantity: 30,
    discountPercentage: null,
    effectiveUnitPrice: 5.5,
  },
  {
    description: "Caffè espresso",
    unitOfMeasure: "KG",
    unitPrice: 6.0,
    lastPurchaseDate: "2024-09-10",
    totalQuantity: 15,
    discountPercentage: 20,
    effectiveUnitPrice: 4.8,
  },
  {
    description: "Tè verde",
    unitOfMeasure: "KG",
    unitPrice: 8.0,
    lastPurchaseDate: "2024-03-15",
    totalQuantity: 5,
    discountPercentage: null,
    effectiveUnitPrice: 8.0,
  },
];

describe("PriceListPage", { timeout: 15000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSuppliers.mockResolvedValue(suppliers);
    mockFetchPriceList.mockResolvedValue(priceListResults);
    mockExportXlsx.mockResolvedValue(undefined);
    mockExportPdf.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Helper: waits for suppliers to load, selects one, and clicks search */
  async function selectSupplierAndSearch(supplierName: string) {
    // Wait for suppliers to load (resolve disabled state)
    await waitFor(() => {
      const input = screen.getByPlaceholderText("Seleziona un fornitore");
      expect(input).not.toBeDisabled();
    });

    // Type supplier name into the searchable select input
    const selectInput = screen.getByPlaceholderText("Seleziona un fornitore");
    await act(async () => {
      fireEvent.change(selectInput, { target: { value: supplierName } });
    });

    // Wait for matching option to appear (may be hidden via CSS portal)
    const option = await waitFor(() => {
      const opt = screen.getByRole("option", { name: supplierName, hidden: true });
      expect(opt).toBeDefined();
      return opt;
    });
    await act(async () => {
      fireEvent.click(option);
    });

    // Click the search button
    const searchButton = screen.getByRole("button", { name: /Cerca/ });
    await act(async () => {
      fireEvent.click(searchButton);
    });
  }

  it("should render title", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );
    expect(screen.getByText("Listini")).toBeInTheDocument();
  });

  it("should load and display suppliers in select", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(mockFetchSuppliers).toHaveBeenCalled();
    });
    expect(screen.getByPlaceholderText("Seleziona un fornitore")).toBeInTheDocument();
  });

  it("should show initial help text", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );
    expect(
      screen.getByText(/Seleziona un fornitore e premi/)
    ).toBeInTheDocument();
  });

  it("should have search button disabled when no supplier selected", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(mockFetchSuppliers).toHaveBeenCalled();
    });
    const searchButton = screen.getByRole("button", { name: /Cerca/ });
    expect(searchButton).toBeDisabled();
  });

  it("should have export buttons disabled before search", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(mockFetchSuppliers).toHaveBeenCalled();
    });
    expect(screen.getByRole("button", { name: /Esporta Excel/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Esporta PDF/ })).toBeDisabled();
  });

  it("should render date picker inputs", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );
    expect(screen.getByText("Da")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("should display results after search", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );

    await selectSupplierAndSearch("Alfa SRL");

    await waitFor(() => {
      // With default preset "last12Months", dates are automatically set
      expect(mockFetchPriceList).toHaveBeenCalled();
      const [supplierId, from, to] = mockFetchPriceList.mock.calls[0];
      expect(supplierId).toBe("s1");
      expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO date format
      expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    await waitFor(() => {
      expect(screen.getAllByText("Caffè espresso").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("Tè verde")).toBeInTheDocument();
    expect(screen.getByText(/3 prodotti trovati/)).toBeInTheDocument();
  });

  it("should display table headers including new discount columns", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );

    await selectSupplierAndSearch("Alfa SRL");

    await waitFor(() => {
      expect(screen.getByText("Descrizione")).toBeInTheDocument();
    });
    expect(screen.getByText("U.M.")).toBeInTheDocument();
    expect(screen.getByText("Prezzo unitario")).toBeInTheDocument();
    expect(screen.getByText("Sconto (%)")).toBeInTheDocument();
    expect(screen.getByText("Prezzo effettivo")).toBeInTheDocument();
    expect(screen.getByText("Ultimo acquisto")).toBeInTheDocument();
    expect(screen.getByText("Quantità totale")).toBeInTheDocument();
  });

  it("should enable export buttons after search", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );

    await selectSupplierAndSearch("Alfa SRL");

    await waitFor(() => {
      expect(screen.getAllByText("Caffè espresso").length).toBeGreaterThan(0);
    });

    expect(screen.getByRole("button", { name: /Esporta Excel/ })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /Esporta PDF/ })).not.toBeDisabled();
  });

  it("should call exportPriceListXlsx when Esporta Excel is clicked", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );

    await selectSupplierAndSearch("Alfa SRL");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Esporta Excel/ })).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Esporta Excel/ }));
    });

    await waitFor(() => {
      expect(mockExportXlsx).toHaveBeenCalledWith("s1", expect.anything(), expect.anything());
    });
  });

  it("should call exportPriceListPdf when Esporta PDF is clicked", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );

    await selectSupplierAndSearch("Alfa SRL");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Esporta PDF/ })).not.toBeDisabled();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Esporta PDF/ }));
    });

    await waitFor(() => {
      expect(mockExportPdf).toHaveBeenCalledWith("s1", expect.anything(), expect.anything());
    });
  });

  it("should show empty message when no results", async () => {
    mockFetchPriceList.mockResolvedValue([]);
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );

    await selectSupplierAndSearch("Alfa SRL");

    await waitFor(() => {
      expect(screen.getByText("Nessun prodotto trovato per i criteri selezionati.")).toBeInTheDocument();
    });
  });

  it("should use singular text when 1 result", async () => {
    mockFetchPriceList.mockResolvedValue([priceListResults[0]]);
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );

    await selectSupplierAndSearch("Alfa SRL");

    await waitFor(() => {
      expect(screen.getByText(/1 prodotto trovato/)).toBeInTheDocument();
    });
  });

  it("should set default date preset to last12Months", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );
    
    // Verify the preset control is rendered with the expected options
    expect(screen.getByText("Tutte")).toBeInTheDocument();
    expect(screen.getByText("Ultimi 3 mesi")).toBeInTheDocument();
    expect(screen.getByText("Ultimi 6 mesi")).toBeInTheDocument();
    expect(screen.getByText("Ultimi 12 mesi")).toBeInTheDocument();
  });

  it("should call API with undefined dates when preset is all", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );

    // Wait for suppliers to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Seleziona un fornitore")).not.toBeDisabled();
    });

    // Click "Tutte" preset
    const allButton = screen.getByRole("radio", { name: "Tutte" });
    await act(async () => {
      fireEvent.click(allButton);
    });

    // Select supplier and search
    await selectSupplierAndSearch("Alfa SRL");

    await waitFor(() => {
      expect(mockFetchPriceList).toHaveBeenCalledWith("s1", undefined, undefined);
    });
  });
});

describe("PriceListPage", { timeout: 15000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSuppliers.mockResolvedValue(suppliers);
    mockFetchPriceList.mockResolvedValue(priceListResults);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Helper: waits for suppliers to load, selects one, and clicks search */
  async function selectSupplierAndSearch(supplierName: string) {
    // Wait for suppliers to load (resolve disabled state)
    await waitFor(() => {
      const input = screen.getByPlaceholderText("Seleziona un fornitore");
      expect(input).not.toBeDisabled();
    });

    // Type supplier name into the searchable select input
    const selectInput = screen.getByPlaceholderText("Seleziona un fornitore");
    await act(async () => {
      fireEvent.change(selectInput, { target: { value: supplierName } });
    });

    // Wait for matching option to appear (may be hidden via CSS portal)
    const option = await waitFor(() => {
      const opt = screen.getByRole("option", { name: supplierName, hidden: true });
      expect(opt).toBeDefined();
      return opt;
    });
    await act(async () => {
      fireEvent.click(option);
    });

    // Click the search button
    const searchButton = screen.getByRole("button", { name: /Cerca/ });
    await act(async () => {
      fireEvent.click(searchButton);
    });
  }

  it("should render title", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );
    expect(screen.getByText("Listini")).toBeInTheDocument();
  });

  it("should load and display suppliers in select", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(mockFetchSuppliers).toHaveBeenCalled();
    });
    expect(screen.getByPlaceholderText("Seleziona un fornitore")).toBeInTheDocument();
  });

  it("should show initial help text", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );
    expect(
      screen.getByText(/Seleziona un fornitore e premi/)
    ).toBeInTheDocument();
  });

  it("should have search button disabled when no supplier selected", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(mockFetchSuppliers).toHaveBeenCalled();
    });
    const searchButton = screen.getByRole("button", { name: /Cerca/ });
    expect(searchButton).toBeDisabled();
  });

  it("should render date picker inputs", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );
    expect(screen.getByText("Da")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("should display results after search", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );

    await selectSupplierAndSearch("Alfa SRL");

    await waitFor(() => {
      // With default preset "last12Months", dates are automatically set
      expect(mockFetchPriceList).toHaveBeenCalled();
      const [supplierId, from, to] = mockFetchPriceList.mock.calls[0];
      expect(supplierId).toBe("s1");
      expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO date format
      expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    await waitFor(() => {
      expect(screen.getAllByText("Caffè espresso").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("Tè verde")).toBeInTheDocument();
    expect(screen.getByText(/3 prodotti trovati/)).toBeInTheDocument();
  });

  it("should display table headers when results are shown", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );

    await selectSupplierAndSearch("Alfa SRL");

    await waitFor(() => {
      expect(screen.getByText("Descrizione")).toBeInTheDocument();
    });
    expect(screen.getByText("U.M.")).toBeInTheDocument();
    expect(screen.getByText("Prezzo unitario")).toBeInTheDocument();
    expect(screen.getByText("Ultimo acquisto")).toBeInTheDocument();
    expect(screen.getByText("Quantità totale")).toBeInTheDocument();
  });

  it("should show empty message when no results", async () => {
    mockFetchPriceList.mockResolvedValue([]);
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );

    await selectSupplierAndSearch("Alfa SRL");

    await waitFor(() => {
      expect(screen.getByText("Nessun prodotto trovato per i criteri selezionati.")).toBeInTheDocument();
    });
  });

  it("should use singular text when 1 result", async () => {
    mockFetchPriceList.mockResolvedValue([priceListResults[0]]);
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );

    await selectSupplierAndSearch("Alfa SRL");

    await waitFor(() => {
      expect(screen.getByText(/1 prodotto trovato/)).toBeInTheDocument();
    });
  });

  it("should set default date preset to last12Months", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );
    
    // Verify the preset control is rendered with the expected options
    expect(screen.getByText("Tutte")).toBeInTheDocument();
    expect(screen.getByText("Ultimi 3 mesi")).toBeInTheDocument();
    expect(screen.getByText("Ultimi 6 mesi")).toBeInTheDocument();
    expect(screen.getByText("Ultimi 12 mesi")).toBeInTheDocument();
  });

  it("should call API with undefined dates when preset is all", async () => {
    render(
      <TestWrapper>
        <PriceListPage />
      </TestWrapper>
    );

    // Wait for suppliers to load
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Seleziona un fornitore")).not.toBeDisabled();
    });

    // Click "Tutte" preset
    const allButton = screen.getByRole("radio", { name: "Tutte" });
    await act(async () => {
      fireEvent.click(allButton);
    });

    // Select supplier and search
    await selectSupplierAndSearch("Alfa SRL");

    await waitFor(() => {
      expect(mockFetchPriceList).toHaveBeenCalledWith("s1", undefined, undefined);
    });
  });
});
