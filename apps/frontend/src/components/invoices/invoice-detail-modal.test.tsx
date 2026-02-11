import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { InvoiceDetailModal } from "./invoice-detail-modal";
import { TestWrapper } from "@/test-utils";
import type { Invoice } from "@/types";

const sampleInvoice: Invoice = {
  id: "inv-1",
  documentType: "Fattura",
  invoiceNumber: "42/2024",
  date: "2024-06-15",
  supplier: { id: "s1", name: "Test SRL", vatNumber: "IT12345678901", invoiceCount: 1 },
  taxableAmount: 1000,
  taxAmount: 220,
  totalAmount: 1220,
  sdiNumber: "9988776",
  viewed: true,
  currency: "EUR",
  supplierFiscalCode: "RSSMRA80A01H501Z",
  supplierAddress: "Via Roma 1",
  supplierCap: "00100",
  supplierCity: "Roma",
  supplierProvince: "RM",
  paymentMethod: "MP05",
  paymentDueDate: "2024-07-15",
  iban: "IT60X0542811101000000123456",
  lineItems: [
    {
      id: "li-1",
      lineNumber: 1,
      description: "Prodotto A",
      quantity: 10,
      unitOfMeasure: "PZ",
      unitPrice: 100,
      totalPrice: 1000,
      vatRate: 22,
      articleCode: null,
      articleCodeType: null,
      eanCode: null,
      discountType: null,
      discountPercentage: null,
    },
  ],
  attachments: [
    { id: "att-1", fileName: "fattura.pdf", contentType: "application/pdf" },
  ],
};

describe("InvoiceDetailModal", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render nothing when invoice is null", () => {
    const { container } = render(
      <TestWrapper>
        <InvoiceDetailModal invoice={null} opened={true} onClose={onClose} />
      </TestWrapper>
    );
    expect(container.querySelector(".mantine-Modal-root")).not.toBeInTheDocument();
  });

  it("should display invoice header info", () => {
    render(
      <TestWrapper>
        <InvoiceDetailModal invoice={sampleInvoice} opened={true} onClose={onClose} />
      </TestWrapper>
    );
    expect(screen.getByText("Fattura")).toBeInTheDocument();
    expect(screen.getByText("42/2024")).toBeInTheDocument();
  });

  it("should display supplier info", () => {
    render(
      <TestWrapper>
        <InvoiceDetailModal invoice={sampleInvoice} opened={true} onClose={onClose} />
      </TestWrapper>
    );
    expect(screen.getByText("Test SRL")).toBeInTheDocument();
    expect(screen.getByText(/IT12345678901/)).toBeInTheDocument();
  });

  it("should display supplier address", () => {
    render(
      <TestWrapper>
        <InvoiceDetailModal invoice={sampleInvoice} opened={true} onClose={onClose} />
      </TestWrapper>
    );
    expect(screen.getByText(/Via Roma 1/)).toBeInTheDocument();
    expect(screen.getByText(/Roma/)).toBeInTheDocument();
  });

  it("should display SDI number", () => {
    render(
      <TestWrapper>
        <InvoiceDetailModal invoice={sampleInvoice} opened={true} onClose={onClose} />
      </TestWrapper>
    );
    expect(screen.getByText("9988776")).toBeInTheDocument();
  });

  it("should show viewed status as badge", () => {
    render(
      <TestWrapper>
        <InvoiceDetailModal invoice={sampleInvoice} opened={true} onClose={onClose} />
      </TestWrapper>
    );
    expect(screen.getByText("Visualizzata")).toBeInTheDocument();
  });

  it("should display line items", () => {
    render(
      <TestWrapper>
        <InvoiceDetailModal invoice={sampleInvoice} opened={true} onClose={onClose} />
      </TestWrapper>
    );
    expect(screen.getByText("Prodotto A")).toBeInTheDocument();
  });

  it("should display attachments", () => {
    render(
      <TestWrapper>
        <InvoiceDetailModal invoice={sampleInvoice} opened={true} onClose={onClose} />
      </TestWrapper>
    );
    expect(screen.getByText("fattura.pdf")).toBeInTheDocument();
  });

  it("should display payment info", () => {
    render(
      <TestWrapper>
        <InvoiceDetailModal invoice={sampleInvoice} opened={true} onClose={onClose} />
      </TestWrapper>
    );
    expect(screen.getByText("Bonifico")).toBeInTheDocument();
  });
});
