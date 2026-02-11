import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { InvoiceFormModal } from "./invoice-form-modal";
import { TestWrapper } from "@/test-utils";
import type { Invoice } from "@/types";

const sampleInvoice: Invoice = {
  id: "inv-1",
  documentType: "Fattura",
  invoiceNumber: "1/2024",
  date: "2024-06-15",
  supplier: { id: "s1", name: "Test SRL", vatNumber: "IT12345678901", invoiceCount: 1 },
  taxableAmount: 1000,
  taxAmount: 220,
  totalAmount: 1220,
  sdiNumber: "123456",
  viewed: false,
  lineItems: [],
  attachments: [],
};

describe("InvoiceFormModal", () => {
  const onClose = vi.fn();
  const onSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show 'Nuova Fattura' title when creating", () => {
    render(
      <TestWrapper>
        <InvoiceFormModal
          invoice={null}
          opened={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </TestWrapper>
    );
    expect(screen.getByText("Nuova Fattura")).toBeInTheDocument();
    expect(screen.getByText("Crea fattura")).toBeInTheDocument();
  });

  it("should show 'Modifica Fattura' title when editing", () => {
    render(
      <TestWrapper>
        <InvoiceFormModal
          invoice={sampleInvoice}
          opened={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </TestWrapper>
    );
    expect(screen.getByText("Modifica Fattura")).toBeInTheDocument();
    expect(screen.getByText("Salva modifiche")).toBeInTheDocument();
  });

  it("should render form inputs", () => {
    render(
      <TestWrapper>
        <InvoiceFormModal
          invoice={null}
          opened={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </TestWrapper>
    );
    expect(screen.getByLabelText("Numero fattura")).toBeInTheDocument();
    expect(screen.getByLabelText("Fornitore")).toBeInTheDocument();
    expect(screen.getByLabelText("Partita IVA")).toBeInTheDocument();
  });

  it("should populate form with invoice data when editing", () => {
    render(
      <TestWrapper>
        <InvoiceFormModal
          invoice={sampleInvoice}
          opened={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </TestWrapper>
    );
    expect(screen.getByDisplayValue("1/2024")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test SRL")).toBeInTheDocument();
    expect(screen.getByDisplayValue("IT12345678901")).toBeInTheDocument();
  });

  it("should render cancel button", () => {
    render(
      <TestWrapper>
        <InvoiceFormModal
          invoice={null}
          opened={true}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </TestWrapper>
    );
    expect(screen.getByText("Annulla")).toBeInTheDocument();
  });
});
