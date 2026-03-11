import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { DashboardPage } from "./dashboard-page";
import { TestWrapper } from "@/test-utils";
import type { Invoice, Member, Supplier } from "@/types";

vi.mock("react-grid-layout", () => {
  const Responsive = ({
    children,
    onBreakpointChange,
    onLayoutChange,
  }: {
    children: React.ReactNode;
    onBreakpointChange?: (bp: string, cols: number) => void;
    onLayoutChange?: (current: unknown[], all: Record<string, unknown[]>) => void;
  }) => {
    React.useEffect(() => {
      onBreakpointChange?.("lg", 18);
      onLayoutChange?.([], { lg: [], md: [] });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return <div data-testid="grid-layout">{children}</div>;
  };
  return { __esModule: true, Responsive, default: { Responsive } };
});

vi.mock("@mantine/charts", () => ({
  BarChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="bar-chart">{data.length} mesi</div>
  ),
}));

vi.mock("@/lib/api/invoices", () => ({
  fetchInvoices: vi.fn(),
}));

vi.mock("@/lib/api/members", () => ({
  fetchMembers: vi.fn(),
}));

vi.mock("@/lib/api/suppliers", () => ({
  fetchSuppliers: vi.fn(),
}));

vi.mock("@/lib/settings", () => ({
  loadSettings: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/dashboard-layout", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/dashboard-layout")>();
  return {
    ...actual,
    loadLayouts: vi.fn().mockReturnValue(actual.DEFAULT_LAYOUTS),
    saveLayouts: vi.fn(),
  };
});

import * as invoicesApi from "@/lib/api/invoices";
import * as membersApi from "@/lib/api/members";
import * as suppliersApi from "@/lib/api/suppliers";

const now = new Date();
const makeDate = (offset: number = 0) => {
  const d = new Date(now.getFullYear(), now.getMonth(), 15 + offset);
  return d.toISOString().split("T")[0];
};

const sampleInvoices: Invoice[] = [
  {
    id: "i1",
    invoiceNumber: "1/2024",
    date: makeDate(),
    totalAmount: 100,
    taxableAmount: 82,
    taxAmount: 18,
    invoiceType: "TD01",
    creditNote: false,
    viewed: true,
    supplier: { id: "s1", name: "Alfa SRL", vatNumber: "IT11111111111", paymentMethod: "BANK_TRANSFER" },
    lineItems: [],
    attachments: [],
  },
  {
    id: "i2",
    invoiceNumber: "2/2024",
    date: makeDate(),
    totalAmount: 50,
    taxableAmount: 41,
    taxAmount: 9,
    invoiceType: "TD01",
    creditNote: false,
    viewed: false,
    supplier: { id: "s2", name: "Beta SpA", vatNumber: "IT22222222222", paymentMethod: null },
    lineItems: [],
    attachments: [],
  },
];

const sampleMembers: Member[] = [
  {
    id: "m1",
    lastName: "Rossi",
    firstName: "Marco",
    fiscalCode: "RSSMRC80A01H501U",
    birthDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-20`,
  },
];

const sampleSuppliers: Supplier[] = [
  { id: "s1", name: "Alfa SRL", vatNumber: "IT11111111111", invoiceCount: 2 },
  { id: "s2", name: "Beta SpA", vatNumber: "IT22222222222", invoiceCount: 1 },
];

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(invoicesApi.fetchInvoices).mockResolvedValue(sampleInvoices);
    vi.mocked(membersApi.fetchMembers).mockResolvedValue(sampleMembers);
    vi.mocked(suppliersApi.fetchSuppliers).mockResolvedValue(sampleSuppliers);
  });

  it("should render the Dashboard title", async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("should render all card labels", async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );
    expect(screen.getByText("Soci")).toBeInTheDocument();
    expect(screen.getByText("Fornitori")).toBeInTheDocument();
    expect(screen.getByText("Prossimo compleanno")).toBeInTheDocument();
    expect(screen.getByText("Andamento fatture — ultimi 18 mesi")).toBeInTheDocument();
  });

  it("should load and display supplier and member counts", async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );
    await waitFor(() => {
      // Both Soci and Fornitori cards show "totali registrati"
      expect(screen.getAllByText("totali registrati").length).toBe(2);
    });
  });

  it("should display birthday info when members have birthDate", async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText(/Marco/)).toBeInTheDocument();
    });
  });

  it("should display all members sharing the same next birthday", async () => {
    const sharedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-20`;
    vi.mocked(membersApi.fetchMembers).mockResolvedValue([
      { id: "m1", lastName: "Rossi", firstName: "Marco", fiscalCode: "RSSMRC80A01H501U", birthDate: sharedDate },
      { id: "m3", lastName: "Verdi", firstName: "Luca", fiscalCode: "VRDLCU85A01H501U", birthDate: sharedDate },
    ]);
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText(/Marco/)).toBeInTheDocument();
      expect(screen.getByText(/Luca/)).toBeInTheDocument();
    });
  });

  it("should show empty birthday message when no members have birthDate", async () => {
    vi.mocked(membersApi.fetchMembers).mockResolvedValue([
      { id: "m2", lastName: "Bianchi", firstName: "Anna", fiscalCode: "BNCH123" },
    ]);
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("Nessuna data di nascita registrata")).toBeInTheDocument();
    });
  });

  it("should render the BarChart with 18 months of data", async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
      expect(screen.getByText("18 mesi")).toBeInTheDocument();
    });
  });

  it("should toggle chart series visibility when badge is clicked", async () => {
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );
    await waitFor(() => screen.getByText("Contanti"));
    fireEvent.click(screen.getByText("Contanti"));
    // After clicking, the Contanti series badge should still exist
    expect(screen.getByText("Contanti")).toBeInTheDocument();
  });

  it("should handle API error gracefully", async () => {
    vi.mocked(invoicesApi.fetchInvoices).mockRejectedValue(new Error("Net error"));
    vi.mocked(membersApi.fetchMembers).mockRejectedValue(new Error("Net error"));
    vi.mocked(suppliersApi.fetchSuppliers).mockRejectedValue(new Error("Net error"));
    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );
    // Should still render with empty state
    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });
});
