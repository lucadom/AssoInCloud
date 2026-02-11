import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SupplierFormModal } from "./supplier-form-modal";
import { TestWrapper } from "@/test-utils";
import type { Supplier } from "@/types";

describe("SupplierFormModal", () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show 'Nuovo Fornitore' title when creating", () => {
    render(
      <TestWrapper>
        <SupplierFormModal
          supplier={null}
          opened={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </TestWrapper>
    );
    expect(screen.getByText("Nuovo Fornitore")).toBeInTheDocument();
    expect(screen.getByText("Crea fornitore")).toBeInTheDocument();
  });

  it("should show 'Modifica Fornitore' title when editing", () => {
    const supplier: Supplier = {
      id: "s1",
      name: "Test SRL",
      vatNumber: "IT12345678901",
      invoiceCount: 0,
    };
    render(
      <TestWrapper>
        <SupplierFormModal
          supplier={supplier}
          opened={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </TestWrapper>
    );
    expect(screen.getByText("Modifica Fornitore")).toBeInTheDocument();
    expect(screen.getByText("Salva modifiche")).toBeInTheDocument();
  });

  it("should render form inputs", () => {
    render(
      <TestWrapper>
        <SupplierFormModal
          supplier={null}
          opened={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </TestWrapper>
    );
    expect(screen.getByLabelText("Ragione sociale")).toBeInTheDocument();
    expect(screen.getByLabelText("Partita IVA")).toBeInTheDocument();
  });

  it("should populate form with supplier data when editing", () => {
    const supplier: Supplier = {
      id: "s1",
      name: "Test SRL",
      vatNumber: "IT12345678901",
      invoiceCount: 0,
    };
    render(
      <TestWrapper>
        <SupplierFormModal
          supplier={supplier}
          opened={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </TestWrapper>
    );
    expect(screen.getByDisplayValue("Test SRL")).toBeInTheDocument();
    expect(screen.getByDisplayValue("IT12345678901")).toBeInTheDocument();
  });
});
