import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeleteConfirmModal } from "./delete-confirm-modal";
import { TestWrapper } from "@/test-utils";
import type { Invoice } from "@/types";

const sampleInvoice: Invoice = {
  id: "inv-1",
  documentType: "TD01",
  documentTypeDescription: "Fattura",
  creditNote: false,
  invoiceNumber: "1/2024",
  date: "2024-06-15",
  supplier: { id: "s1", name: "Test SRL", vatNumber: "IT12345678901", invoiceCount: 1 },
  taxableAmount: 100,
  taxAmount: 22,
  totalAmount: 122,
  sdiNumber: "123456",
  viewed: false,
  lineItems: [],
  attachments: [],
};

describe("DeleteConfirmModal", () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing when invoice is null", () => {
    const { container } = render(
      <TestWrapper>
        <DeleteConfirmModal
          invoice={null}
          opened={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      </TestWrapper>
    );
    expect(container.querySelector(".mantine-Modal-root")).not.toBeInTheDocument();
  });

  it("should display invoice supplier name", () => {
    render(
      <TestWrapper>
        <DeleteConfirmModal
          invoice={sampleInvoice}
          opened={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      </TestWrapper>
    );
    expect(screen.getByText("Test SRL")).toBeInTheDocument();
  });

  it("should show delete and cancel buttons", () => {
    render(
      <TestWrapper>
        <DeleteConfirmModal
          invoice={sampleInvoice}
          opened={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      </TestWrapper>
    );
    expect(screen.getByText("Elimina")).toBeInTheDocument();
    expect(screen.getByText("Annulla")).toBeInTheDocument();
  });

  it("should show warning text", () => {
    render(
      <TestWrapper>
        <DeleteConfirmModal
          invoice={sampleInvoice}
          opened={true}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      </TestWrapper>
    );
    expect(screen.getByText("Questa azione non può essere annullata.")).toBeInTheDocument();
  });
});
