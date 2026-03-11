import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { InvoicesTable, dateRangeFilterFn } from "./invoices-table";
import { TestWrapper } from "@/test-utils";
import type { Invoice } from "@/types";

const makeInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: "inv-1",
  documentType: "TD01",
  documentTypeDescription: "Fattura",
  creditNote: false,
  invoiceNumber: "1/2024",
  date: "2024-06-15",
  supplier: { id: "s1", name: "Alfa SRL", vatNumber: "IT11111111111", invoiceCount: 1 },
  taxableAmount: 1000,
  taxAmount: 220,
  totalAmount: 1220,
  sdiNumber: "123456",
  viewed: false,
  lineItems: [],
  attachments: [],
  ...overrides,
});

const invoices: Invoice[] = [
  makeInvoice({ id: "inv-1", invoiceNumber: "1/2024", supplier: { id: "s1", name: "Alfa SRL", vatNumber: "IT11111111111", invoiceCount: 1 } }),
  makeInvoice({ id: "inv-2", invoiceNumber: "2/2024", date: "2024-07-20", supplier: { id: "s2", name: "Beta SpA", vatNumber: "IT22222222222", invoiceCount: 1 }, taxableAmount: 500, taxAmount: 110, totalAmount: 610 }),
  makeInvoice({ id: "inv-3", invoiceNumber: "NC/1", documentType: "TD04", documentTypeDescription: "Nota di Credito", creditNote: true, supplier: { id: "s3", name: "Gamma Coop", vatNumber: "IT33333333333", invoiceCount: 1 }, taxableAmount: 200, taxAmount: 44, totalAmount: 244 }),
];

describe("InvoicesTable", () => {
  const onView = vi.fn();
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all invoices", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getAllByText("Alfa SRL").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Beta SpA").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Gamma Coop").length).toBeGreaterThanOrEqual(1);
  });

  it("should show empty state when no invoices", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={[]} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getByText(/Nessuna fattura presente/)).toBeInTheDocument();
  });

  it("should display column headers", () => {
    const { container } = render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    // MRT renders column headers; check visible columns (documentType/invoiceNumber/taxableAmount/taxAmount are hidden by default)
    const ths = Array.from(container.querySelectorAll("th"));
    const headerTexts = ths.map((th) => th.textContent ?? "");
    expect(headerTexts.some((t) => t.includes("Data"))).toBe(true);
    expect(headerTexts.some((t) => t.includes("Fornitore"))).toBe(true);
    expect(headerTexts.some((t) => t.includes("Totale"))).toBe(true);
  });

  it("should display credit note row", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    // The documentType column is hidden by default; verify the credit note row is rendered via supplier name
    expect(screen.getAllByText("Gamma Coop").length).toBeGreaterThanOrEqual(1);
  });

  it("should display date preset segmented control", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getByText("Tutte")).toBeInTheDocument();
    expect(screen.getByText("Questo mese")).toBeInTheDocument();
    expect(screen.getByText("Anno corrente")).toBeInTheDocument();
  });

  it("should filter by date preset", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    // Click "Questo mese" — invoices from 2024 won't be in this month
    fireEvent.click(screen.getByText("Questo mese"));
    expect(screen.queryByText("Alfa SRL")).not.toBeInTheDocument();
  });

  it("should switch between date presets", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Ultimi 3 mesi"));
    fireEvent.click(screen.getByText("Due mesi fa"));
    fireEvent.click(screen.getByText("Anno corrente"));
    // Back to all
    fireEvent.click(screen.getByText("Tutte"));
    expect(screen.getAllByText("Alfa SRL").length).toBeGreaterThanOrEqual(1);
  });

  it("should render action buttons for each row", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    // Should have 3 view buttons, 3 edit buttons, 3 delete buttons
    const viewButtons = screen.getAllByLabelText("Visualizza");
    const editButtons = screen.getAllByLabelText("Modifica");
    const deleteButtons = screen.getAllByLabelText("Elimina");
    expect(viewButtons.length).toBe(3);
    expect(editButtons.length).toBe(3);
    expect(deleteButtons.length).toBe(3);
  });
});

describe("dateRangeFilterFn", () => {
  function makeRow(dateStr: string) {
    return { getValue: (_id: string) => new Date(dateStr) };
  }

  it("should return true when no filter is set (both null)", () => {
    const row = makeRow("2024-06-15");
    expect(dateRangeFilterFn(row, "date", [null, null])).toBe(true);
  });

  it("should return true when filterValue is undefined", () => {
    const row = makeRow("2024-06-15");
    expect(dateRangeFilterFn(row, "date", undefined as unknown as [null, null])).toBe(true);
  });

  it("should filter out rows before the from date", () => {
    const row = makeRow("2024-05-31");
    const from = new Date("2024-06-01");
    expect(dateRangeFilterFn(row, "date", [from, null])).toBe(false);
  });

  it("should include rows on the from date", () => {
    const row = makeRow("2024-06-01");
    const from = new Date("2024-06-01");
    expect(dateRangeFilterFn(row, "date", [from, null])).toBe(true);
  });

  it("should filter out rows after the to date (end of day)", () => {
    const row = makeRow("2024-06-16");
    const to = new Date("2024-06-15");
    expect(dateRangeFilterFn(row, "date", [null, to])).toBe(false);
  });

  it("should include rows on the to date (end of day boundary)", () => {
    const to = new Date("2024-06-15");
    const endOfDay = new Date("2024-06-15T23:59:59.999");
    const rowAtEndOfDay = { getValue: (_id: string) => endOfDay };
    expect(dateRangeFilterFn(rowAtEndOfDay, "date", [null, to])).toBe(true);
  });

  it("should include rows in the from-to range", () => {
    const row = makeRow("2024-06-10");
    const from = new Date("2024-06-01");
    const to = new Date("2024-06-30");
    expect(dateRangeFilterFn(row, "date", [from, to])).toBe(true);
  });

  it("should exclude rows outside the from-to range", () => {
    const beforeRange = makeRow("2024-05-31");
    const afterRange = makeRow("2024-07-01");
    const from = new Date("2024-06-01");
    const to = new Date("2024-06-30");
    expect(dateRangeFilterFn(beforeRange, "date", [from, to])).toBe(false);
    expect(dateRangeFilterFn(afterRange, "date", [from, to])).toBe(false);
  });

  it("should return true when cell value is not a Date", () => {
    const row = { getValue: (_id: string) => "not-a-date" };
    const from = new Date("2024-06-01");
    expect(dateRangeFilterFn(row, "date", [from, null])).toBe(true);
  });
});
