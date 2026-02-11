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

  it("should render action buttons for each supplier", () => {
    render(
      <TestWrapper>
        <SuppliersTable suppliers={suppliers} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    // Should have 3 edit buttons and 3 delete buttons
    const editButtons = screen.getAllByLabelText("Modifica");
    expect(editButtons.length).toBe(3);
  });

  it("should call onEdit when edit button is clicked", () => {
    render(
      <TestWrapper>
        <SuppliersTable suppliers={suppliers} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    const editButtons = screen.getAllByLabelText("Modifica");
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
