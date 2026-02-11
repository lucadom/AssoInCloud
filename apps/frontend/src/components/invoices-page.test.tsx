import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { InvoicesPage } from "./invoices-page";
import { TestWrapper } from "@/test-utils";
import type { Invoice } from "@/types";

// Mock the API module
vi.mock("@/lib/api/invoices", () => ({
  fetchInvoices: vi.fn(),
  createInvoice: vi.fn(),
  updateInvoice: vi.fn(),
  deleteInvoice: vi.fn(),
  uploadCsv: vi.fn(),
  uploadInvoiceFiles: vi.fn(),
  getAttachmentUrl: vi.fn(),
}));

// Mock notifications
vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
}));

import * as api from "@/lib/api/invoices";

const mockFetchInvoices = vi.mocked(api.fetchInvoices);
const mockDeleteInvoice = vi.mocked(api.deleteInvoice);
const mockCreateInvoice = vi.mocked(api.createInvoice);

const invoices: Invoice[] = [
  {
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
  },
];

describe("InvoicesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchInvoices.mockResolvedValue(invoices);
  });

  it("should render title", () => {
    render(
      <TestWrapper>
        <InvoicesPage />
      </TestWrapper>
    );
    expect(screen.getByText("Fatture")).toBeInTheDocument();
  });

  it("should render action buttons", () => {
    render(
      <TestWrapper>
        <InvoicesPage />
      </TestWrapper>
    );
    expect(screen.getByText("Carica CSV")).toBeInTheDocument();
    expect(screen.getByText("Carica Fattura")).toBeInTheDocument();
    expect(screen.getByText("Nuova Fattura")).toBeInTheDocument();
  });

  it("should load and display invoices", async () => {
    render(
      <TestWrapper>
        <InvoicesPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("Alfa SRL")).toBeInTheDocument();
    });
  });

  it("should call fetchInvoices on mount", async () => {
    render(
      <TestWrapper>
        <InvoicesPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(mockFetchInvoices).toHaveBeenCalledTimes(1);
    });
  });

  it("should show error notification on load failure", async () => {
    const { notifications } = await import("@mantine/notifications");
    mockFetchInvoices.mockRejectedValue(new Error("Network error"));
    render(
      <TestWrapper>
        <InvoicesPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Errore",
          color: "red",
        })
      );
    });
  });

  it("should open CSV upload modal when clicking 'Carica CSV'", async () => {
    render(
      <TestWrapper>
        <InvoicesPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("Alfa SRL")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Carica CSV"));
    // The CsvUploadModal should appear
    await waitFor(() => {
      expect(screen.getByText(/Carica uno o più file CSV/)).toBeInTheDocument();
    });
  });

  it("should open invoice upload modal when clicking 'Carica Fattura'", async () => {
    render(
      <TestWrapper>
        <InvoicesPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("Alfa SRL")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Carica Fattura"));
    await waitFor(() => {
      expect(screen.getByText(/Carica uno o più file fattura/)).toBeInTheDocument();
    });
  });

  it("should open create form modal when clicking 'Nuova Fattura'", async () => {
    render(
      <TestWrapper>
        <InvoicesPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("Alfa SRL")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Nuova Fattura"));
    await waitFor(() => {
      expect(screen.getByText("Nuova Fattura")).toBeInTheDocument();
    });
  });
});
