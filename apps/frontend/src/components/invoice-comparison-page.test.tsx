import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InvoiceComparisonPage } from "./invoice-comparison-page";
import { TestWrapper } from "@/test-utils";
import type { InvoiceMonthlySummary, Supplier } from "@/types";

vi.mock("@/lib/api/suppliers", () => ({
  fetchSuppliers: vi.fn(),
}));

vi.mock("@/lib/api/invoices", () => ({
  fetchInvoiceMonthlySummary: vi.fn(),
}));

vi.mock("@mantine/charts", () => ({
  LineChart: ({ data, series }: { data: unknown[]; series: { name: string }[] }) => (
    <div data-testid="line-chart">{JSON.stringify({ data, series })}</div>
  ),
}));

import { fetchSuppliers } from "@/lib/api/suppliers";
import { fetchInvoiceMonthlySummary } from "@/lib/api/invoices";

const mockFetchSuppliers = vi.mocked(fetchSuppliers);
const mockFetchSummary = vi.mocked(fetchInvoiceMonthlySummary);

const suppliers: Supplier[] = [
  { id: "s1", name: "Alfa SRL", vatNumber: "IT11111111111", invoiceCount: 2 },
  { id: "s2", name: "Beta SpA", vatNumber: "IT22222222222", invoiceCount: 0 },
];

const summaries: InvoiceMonthlySummary[] = [
  { year: 2024, month: 1, totalAmount: 100 },
  { year: 2024, month: 2, totalAmount: 0 },
  { year: 2025, month: 1, totalAmount: 120 },
  { year: 2025, month: 2, totalAmount: 80 },
];

describe("InvoiceComparisonPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSuppliers.mockResolvedValue(suppliers);
    mockFetchSummary.mockImplementation(async (supplierId) =>
      supplierId === "s1" ? summaries : [],
    );
  });

  async function chooseSupplier(name: string) {
    const input = screen.getByPlaceholderText("Seleziona uno o più fornitori");
    await waitFor(() => expect(input).not.toBeDisabled());
    fireEvent.change(input, { target: { value: name } });
    const option = await screen.findByRole("option", { name, hidden: true });
    await act(async () => {
      fireEvent.click(option);
    });
  }

  it("shows all years by default and fills a missing month with zero", async () => {
    render(<TestWrapper><InvoiceComparisonPage /></TestWrapper>);
    await chooseSupplier("Alfa SRL");

    const chart = await screen.findByTestId("line-chart");
    await waitFor(() => expect(mockFetchSummary).toHaveBeenCalledWith("s1"));
    const chartModel = JSON.parse(chart.textContent ?? "{}") as {
      data: { month: string; "s1-2024": number; "s1-2025": number }[];
      series: { name: string; label: string }[];
    };
    expect(chartModel.series.map((item) => item.label)).toEqual(["Alfa SRL - 2024", "Alfa SRL - 2025"]);
    expect(chartModel.data).toHaveLength(12);
    expect(chartModel.data[1]).toMatchObject({ month: "Febbraio", "s1-2024": 0, "s1-2025": 80 });
    expect(chartModel.data[11]).toMatchObject({ month: "Dicembre", "s1-2024": 0, "s1-2025": 0 });
  });

  it("shows only the years left selected by the user", async () => {
    render(<TestWrapper><InvoiceComparisonPage /></TestWrapper>);
    await chooseSupplier("Alfa SRL");
    const chart = await screen.findByTestId("line-chart");

    fireEvent.click(screen.getByPlaceholderText("Seleziona gli anni"));
    fireEvent.click(await screen.findByRole("option", { name: "2025", hidden: true }));

    await waitFor(() => {
      const chartModel = JSON.parse(chart.textContent ?? "{}") as {
        series: { name: string }[];
      };
      expect(chartModel.series.map((item) => item.name)).toEqual(["s1-2024"]);
    });
  });

  it("shows an empty state when none of the selected suppliers has invoices", async () => {
    mockFetchSummary.mockResolvedValue([]);
    render(<TestWrapper><InvoiceComparisonPage /></TestWrapper>);
    await chooseSupplier("Alfa SRL");
    await chooseSupplier("Beta SpA");
    expect(await screen.findByText("Nessuna fattura disponibile per i fornitori selezionati."))
      .toBeInTheDocument();
    expect(mockFetchSummary).toHaveBeenLastCalledWith("s2");
    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Anni da confrontare")).not.toBeInTheDocument();
  });

  it("combines supplier/year lines without inventing years and resets year selection", async () => {
    mockFetchSummary.mockImplementation(async (supplierId) =>
      supplierId === "s1" ? summaries : [
        { year: 2025, month: 1, totalAmount: 300 },
        { year: 2026, month: 2, totalAmount: -50 },
      ],
    );
    render(<TestWrapper><InvoiceComparisonPage /></TestWrapper>);
    await chooseSupplier("Alfa SRL");
    await screen.findByTestId("line-chart");
    fireEvent.click(screen.getByPlaceholderText("Seleziona gli anni"));
    fireEvent.click(await screen.findByRole("option", { name: "2025", hidden: true }));

    await chooseSupplier("Beta SpA");
    const chart = await screen.findByTestId("line-chart");
    const model = JSON.parse(chart.textContent ?? "{}") as {
      data: Record<string, string | number>[];
      series: { name: string; label: string }[];
    };
    expect(model.series.map((item) => item.label)).toEqual([
      "Alfa SRL - 2024", "Alfa SRL - 2025", "Beta SpA - 2025", "Beta SpA - 2026",
    ]);
    expect(model.data[0]).toMatchObject({ "s1-2025": 120, "s2-2025": 300, "s2-2026": 0 });
    expect(model.data[1]).toMatchObject({ "s2-2025": 0, "s2-2026": -50 });
    expect(model.data[0]).not.toHaveProperty("s2-2024");

    fireEvent.click(screen.getByPlaceholderText("Seleziona gli anni"));
    fireEvent.click(await screen.findByRole("option", { name: "2025", hidden: true }));
    await waitFor(() => {
      const filtered = JSON.parse(chart.textContent ?? "{}") as { series: { name: string }[] };
      expect(filtered.series.map((item) => item.name)).toEqual(["s1-2024", "s2-2026"]);
    });

    await chooseSupplier("Alfa SRL");
    const remaining = await screen.findByTestId("line-chart");
    expect(JSON.parse(remaining.textContent ?? "{}").series).toEqual([
      expect.objectContaining({ name: "s2-2025", label: "Beta SpA - 2025" }),
      expect.objectContaining({ name: "s2-2026", label: "Beta SpA - 2026" }),
    ]);
    fireEvent.click(screen.getByPlaceholderText("Seleziona gli anni"));
    expect(screen.queryByRole("option", { name: "2024", hidden: true })).not.toBeInTheDocument();
  });

  it("keeps populated suppliers visible when another selected supplier has no invoices", async () => {
    render(<TestWrapper><InvoiceComparisonPage /></TestWrapper>);
    await chooseSupplier("Alfa SRL");
    await chooseSupplier("Beta SpA");
    const chart = await screen.findByTestId("line-chart");
    expect(JSON.parse(chart.textContent ?? "{}").series).toHaveLength(2);
    expect(screen.queryByText("Nessuna fattura disponibile per i fornitori selezionati."))
      .not.toBeInTheDocument();
  });

  it("clears the chart and year options when all suppliers are deselected", async () => {
    render(<TestWrapper><InvoiceComparisonPage /></TestWrapper>);
    await chooseSupplier("Alfa SRL");
    await screen.findByTestId("line-chart");
    await chooseSupplier("Alfa SRL");
    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Anni da confrontare")).not.toBeInTheDocument();
    expect(screen.getByText("Seleziona uno o più fornitori per visualizzare il confronto."))
      .toBeInTheDocument();
  });

  it("shows a clear error when the summary cannot be loaded", async () => {
    mockFetchSummary.mockRejectedValue(new Error("network error"));
    render(<TestWrapper><InvoiceComparisonPage /></TestWrapper>);
    await chooseSupplier("Alfa SRL");

    expect(await screen.findByText("Impossibile caricare il confronto delle fatture"))
      .toBeInTheDocument();
  });
});
