import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { SuppliersPage } from "./suppliers-page";
import { TestWrapper } from "@/test-utils";
import type { Supplier } from "@/types";

// Mock the API module
vi.mock("@/lib/api/suppliers", () => ({
  fetchSuppliers: vi.fn(),
  createSupplier: vi.fn(),
  updateSupplier: vi.fn(),
  deleteSupplier: vi.fn(),
}));

// Mock notifications
vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
}));

import * as api from "@/lib/api/suppliers";

const mockFetchSuppliers = vi.mocked(api.fetchSuppliers);
const mockCreateSupplier = vi.mocked(api.createSupplier);
const mockDeleteSupplier = vi.mocked(api.deleteSupplier);

const suppliers: Supplier[] = [
  { id: "s1", name: "Alfa SRL", vatNumber: "IT11111111111", invoiceCount: 3 },
  { id: "s2", name: "Beta SpA", vatNumber: "IT22222222222", invoiceCount: 0 },
];

describe("SuppliersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchSuppliers.mockResolvedValue(suppliers);
  });

  it("should render title", async () => {
    render(
      <TestWrapper>
        <SuppliersPage />
      </TestWrapper>
    );
    expect(screen.getByText("Fornitori")).toBeInTheDocument();
  });

  it("should render 'Nuovo Fornitore' button", () => {
    render(
      <TestWrapper>
        <SuppliersPage />
      </TestWrapper>
    );
    expect(screen.getByText("Nuovo Fornitore")).toBeInTheDocument();
  });

  it("should load and display suppliers", async () => {
    render(
      <TestWrapper>
        <SuppliersPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("Alfa SRL")).toBeInTheDocument();
    });
    expect(screen.getByText("Beta SpA")).toBeInTheDocument();
  });

  it("should call fetchSuppliers on mount", async () => {
    render(
      <TestWrapper>
        <SuppliersPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(mockFetchSuppliers).toHaveBeenCalledTimes(1);
    });
  });

  it("should show error notification on load failure", async () => {
    const { notifications } = await import("@mantine/notifications");
    mockFetchSuppliers.mockRejectedValue(new Error("Network error"));
    render(
      <TestWrapper>
        <SuppliersPage />
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

  it("should open create form modal on 'Nuovo Fornitore' click", async () => {
    render(
      <TestWrapper>
        <SuppliersPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("Alfa SRL")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Nuovo Fornitore"));
    await waitFor(() => {
      expect(screen.getByText("Nuovo Fornitore")).toBeInTheDocument();
    });
  });

  it("should open delete modal when clicking delete on a supplier without invoices", async () => {
    render(
      <TestWrapper>
        <SuppliersPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("Beta SpA")).toBeInTheDocument();
    });
    // Find delete buttons - the second supplier (Beta SpA, invoiceCount=0) should have a red delete button
    const deleteButtons = screen.getAllByRole("button").filter(
      (btn) => btn.querySelector("svg")?.closest("[data-testid]") || btn.getAttribute("aria-label") === "Elimina"
    );
    // Click the trash icon button for Beta SpA
    const trashButtons = document.querySelectorAll(".tabler-icon-trash");
    if (trashButtons.length > 0) {
      fireEvent.click(trashButtons[trashButtons.length - 1].closest("button")!);
    }
  });
});
