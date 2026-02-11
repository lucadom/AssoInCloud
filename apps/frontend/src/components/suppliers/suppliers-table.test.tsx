import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { SuppliersTable } from "./suppliers-table";
import { TestWrapper } from "@/test-utils";
import type { Supplier } from "@/types";

const suppliers: Supplier[] = [
  { id: "s1", name: "Alfa SRL", vatNumber: "IT11111111111", invoiceCount: 3 },
  { id: "s2", name: "Beta SpA", vatNumber: "IT22222222222", invoiceCount: 0 },
  { id: "s3", name: "Gamma Coop", vatNumber: "IT33333333333", invoiceCount: 1 },
];

describe("SuppliersTable", () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all suppliers", () => {
    render(
      <TestWrapper>
        <SuppliersTable suppliers={suppliers} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getByText("Alfa SRL")).toBeInTheDocument();
    expect(screen.getByText("Beta SpA")).toBeInTheDocument();
    expect(screen.getByText("Gamma Coop")).toBeInTheDocument();
  });

  it("should show empty message when no suppliers", () => {
    render(
      <TestWrapper>
        <SuppliersTable suppliers={[]} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getByText("Nessun fornitore presente.")).toBeInTheDocument();
  });

  it("should filter suppliers by search text", () => {
    render(
      <TestWrapper>
        <SuppliersTable suppliers={suppliers} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    const input = screen.getByPlaceholderText("Filtra fornitori...");
    fireEvent.change(input, { target: { value: "alfa" } });
    expect(screen.getByText("Alfa SRL")).toBeInTheDocument();
    expect(screen.queryByText("Beta SpA")).not.toBeInTheDocument();
  });

  it("should filter by VAT number", () => {
    render(
      <TestWrapper>
        <SuppliersTable suppliers={suppliers} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    const input = screen.getByPlaceholderText("Filtra fornitori...");
    fireEvent.change(input, { target: { value: "22222" } });
    expect(screen.getByText("Beta SpA")).toBeInTheDocument();
    expect(screen.queryByText("Alfa SRL")).not.toBeInTheDocument();
  });

  it("should show no results message when filter matches nothing", () => {
    render(
      <TestWrapper>
        <SuppliersTable suppliers={suppliers} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    const input = screen.getByPlaceholderText("Filtra fornitori...");
    fireEvent.change(input, { target: { value: "zzzzz" } });
    expect(screen.getByText("Nessun risultato trovato.")).toBeInTheDocument();
  });

  it("should display VAT numbers as badges", () => {
    render(
      <TestWrapper>
        <SuppliersTable suppliers={suppliers} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getByText("IT11111111111")).toBeInTheDocument();
    expect(screen.getByText("IT22222222222")).toBeInTheDocument();
  });

  it("should display invoice count badges", () => {
    render(
      <TestWrapper>
        <SuppliersTable suppliers={suppliers} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should sort by name when clicking header", () => {
    render(
      <TestWrapper>
        <SuppliersTable suppliers={suppliers} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    // Click on "Ragione sociale" header to sort
    fireEvent.click(screen.getByText("Ragione sociale"));
    // First row should be Alfa (ascending)
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Alfa SRL");

    // Click again to reverse
    fireEvent.click(screen.getByText("Ragione sociale"));
    const rows2 = screen.getAllByRole("row");
    expect(rows2[1]).toHaveTextContent("Gamma Coop");
  });

  it("should sort by vatNumber when clicking header", () => {
    render(
      <TestWrapper>
        <SuppliersTable suppliers={suppliers} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Partita IVA"));
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("IT11111111111");
  });

  it("should sort by invoiceCount when clicking header", () => {
    render(
      <TestWrapper>
        <SuppliersTable suppliers={suppliers} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Fatture"));
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Beta SpA"); // 0 invoices first
  });

  it("should display column headers", () => {
    render(
      <TestWrapper>
        <SuppliersTable suppliers={suppliers} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getByText("Ragione sociale")).toBeInTheDocument();
    expect(screen.getByText("Partita IVA")).toBeInTheDocument();
    expect(screen.getByText("Fatture")).toBeInTheDocument();
    expect(screen.getByText("Azioni")).toBeInTheDocument();
  });
});
