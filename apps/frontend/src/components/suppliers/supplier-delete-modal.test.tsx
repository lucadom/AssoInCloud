import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SupplierDeleteModal } from "./supplier-delete-modal";
import { TestWrapper } from "@/test-utils";
import type { Supplier } from "@/types";

describe("SupplierDeleteModal", () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing when supplier is null", () => {
    const { container } = render(
      <TestWrapper>
        <SupplierDeleteModal
          supplier={null}
          opened={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      </TestWrapper>
    );
    expect(container.querySelector(".mantine-Modal-root")).not.toBeInTheDocument();
  });

  it("should show delete confirmation for supplier without invoices", () => {
    const supplier: Supplier = {
      id: "s1",
      name: "Test SRL",
      vatNumber: "IT12345678901",
      invoiceCount: 0,
    };
    render(
      <TestWrapper>
        <SupplierDeleteModal
          supplier={supplier}
          opened={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      </TestWrapper>
    );
    expect(screen.getByText("Test SRL")).toBeInTheDocument();
    expect(screen.getByText("Elimina")).toBeInTheDocument();
    expect(screen.getByText("Annulla")).toBeInTheDocument();
  });

  it("should show warning when supplier has invoices", () => {
    const supplier: Supplier = {
      id: "s1",
      name: "Test SRL",
      vatNumber: "IT12345678901",
      invoiceCount: 5,
    };
    render(
      <TestWrapper>
        <SupplierDeleteModal
          supplier={supplier}
          opened={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      </TestWrapper>
    );
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Chiudi")).toBeInTheDocument();
    // Should not have delete button when has invoices
    expect(screen.queryByRole("button", { name: "Elimina" })).not.toBeInTheDocument();
  });
});
