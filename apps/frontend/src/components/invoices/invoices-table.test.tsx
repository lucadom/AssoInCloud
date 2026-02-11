import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InvoicesTable } from "./invoices-table";
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
    expect(screen.getByText("Alfa SRL")).toBeInTheDocument();
    expect(screen.getByText("Beta SpA")).toBeInTheDocument();
    expect(screen.getByText("Gamma Coop")).toBeInTheDocument();
  });

  it("should show empty state when no invoices", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={[]} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getByText(/Nessuna fattura presente/)).toBeInTheDocument();
  });

  it("should filter invoices by search text", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    const input = screen.getByPlaceholderText("Filtra fatture...");
    fireEvent.change(input, { target: { value: "alfa" } });
    expect(screen.getByText("Alfa SRL")).toBeInTheDocument();
    expect(screen.queryByText("Beta SpA")).not.toBeInTheDocument();
  });

  it("should filter by invoice number", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    const input = screen.getByPlaceholderText("Filtra fatture...");
    fireEvent.change(input, { target: { value: "NC/1" } });
    expect(screen.getByText("Gamma Coop")).toBeInTheDocument();
    expect(screen.queryByText("Alfa SRL")).not.toBeInTheDocument();
  });

  it("should show no results when filter matches nothing", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    const input = screen.getByPlaceholderText("Filtra fatture...");
    fireEvent.change(input, { target: { value: "zzzzz" } });
    expect(screen.getByText("Nessun risultato trovato.")).toBeInTheDocument();
  });

  it("should display column headers", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getByText("Tipo")).toBeInTheDocument();
    expect(screen.getByText("Numero")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("Fornitore")).toBeInTheDocument();
    expect(screen.getByText("Imponibile")).toBeInTheDocument();
    expect(screen.getByText("Imposta")).toBeInTheDocument();
    expect(screen.getByText("Totale")).toBeInTheDocument();
    expect(screen.getByText("Azioni")).toBeInTheDocument();
  });

  it("should display date preset segmented control", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getByText("Tutte")).toBeInTheDocument();
    expect(screen.getByText("Ultimo mese")).toBeInTheDocument();
    expect(screen.getByText("Anno corrente")).toBeInTheDocument();
  });

  it("should show totals footer", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getByText(/Totale: 3 fatture/)).toBeInTheDocument();
  });

  it("should sort by fornitore when clicking header", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Fornitore"));
    const rows = screen.getAllByRole("row");
    // Should sort ascending by supplier name
    expect(rows[1]).toHaveTextContent("Alfa SRL");

    // Click again to reverse
    fireEvent.click(screen.getByText("Fornitore"));
    const rows2 = screen.getAllByRole("row");
    expect(rows2[1]).toHaveTextContent("Gamma Coop");
  });

  it("should sort by amounts when clicking amount headers", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    // Sort by taxable amount
    fireEvent.click(screen.getByText("Imponibile"));
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Gamma Coop"); // 200 is lowest
  });

  it("should sort by document type", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Tipo"));
    // Fattura comes before Nota di credito alphabetically
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Fattura");
  });

  it("should sort by invoice number", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Numero"));
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("1/2024");
  });

  it("should filter by date preset", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    // Click "Ultimo mese" — invoices from 2024 won't be in last month
    fireEvent.click(screen.getByText("Ultimo mese"));
    // All invoices are from 2024, so none should match
    expect(screen.getByText("Nessun risultato trovato.")).toBeInTheDocument();
  });

  it("should switch between date presets", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    // Click various presets
    fireEvent.click(screen.getByText("Ultimi 3 mesi"));
    fireEvent.click(screen.getByText("Ultimi 6 mesi"));
    fireEvent.click(screen.getByText("Anno corrente"));
    // Back to all
    fireEvent.click(screen.getByText("Tutte"));
    expect(screen.getByText("Alfa SRL")).toBeInTheDocument();
  });

  it("should display credit note amounts as negative", () => {
    render(
      <TestWrapper>
        <InvoicesTable invoices={invoices} onView={onView} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    // Gamma Coop is a credit note (TD04) so amounts should be negative
    expect(screen.getByText("Nota di Credito")).toBeInTheDocument();
  });
});
