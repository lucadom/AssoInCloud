import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AppLayout } from "./app-layout";
import { TestWrapper } from "@/test-utils";

// Mock child components to keep tests focused
vi.mock("./invoices-page", () => ({
  InvoicesPage: () => <div data-testid="invoices-page">InvoicesPage</div>,
}));
vi.mock("./suppliers-page", () => ({
  SuppliersPage: () => <div data-testid="suppliers-page">SuppliersPage</div>,
}));
vi.mock("./products-page", () => ({
  ProductsPage: () => <div data-testid="products-page">ProductsPage</div>,
}));
vi.mock("./members-page", () => ({
  MembersPage: () => <div data-testid="members-page">MembersPage</div>,
}));
vi.mock("./birthdays-page", () => ({
  BirthdaysPage: () => <div data-testid="birthdays-page">BirthdaysPage</div>,
}));
vi.mock("./dashboard-page", () => ({
  DashboardPage: () => <div data-testid="dashboard-page">DashboardPage</div>,
}));

// Mock auth
vi.mock("@/lib/api/auth", () => ({
  logout: vi.fn().mockResolvedValue(undefined),
}));

const mockPush = vi.fn();
// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

import { logout } from "@/lib/api/auth";

describe("AppLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render navigation items", () => {
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Fatture")).toBeInTheDocument();
    expect(screen.getByText("Fornitori")).toBeInTheDocument();
    expect(screen.getByText("Prodotti")).toBeInTheDocument();
    expect(screen.getByText("Soci")).toBeInTheDocument();
    expect(screen.getByText("Elenco")).toBeInTheDocument();
    expect(screen.getByText("Compleanni")).toBeInTheDocument();
  });

  it("should render app title in header", () => {
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );
    expect(screen.getByText("AssoInCloud")).toBeInTheDocument();
  });

  it("should show DashboardPage by default", async () => {
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    });
  });

  it("should show InvoicesPage when clicking Fatture", () => {
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Fatture"));
    expect(screen.getByTestId("invoices-page")).toBeInTheDocument();
  });

  it("should switch to SuppliersPage when clicking Fornitori", () => {
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Fornitori"));
    expect(screen.getByTestId("suppliers-page")).toBeInTheDocument();
    expect(screen.queryByTestId("invoices-page")).not.toBeInTheDocument();
  });

  it("should switch to ProductsPage when clicking Prodotti", () => {
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Prodotti"));
    expect(screen.getByTestId("products-page")).toBeInTheDocument();
    expect(screen.queryByTestId("invoices-page")).not.toBeInTheDocument();
  });

  it("should switch to BirthdaysPage when clicking Compleanni", () => {
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Compleanni"));
    expect(screen.getByTestId("birthdays-page")).toBeInTheDocument();
    expect(screen.queryByTestId("invoices-page")).not.toBeInTheDocument();
  });

  it("should switch back to InvoicesPage from another page", () => {
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Fornitori"));
    expect(screen.getByTestId("suppliers-page")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Fatture"));
    expect(screen.getByTestId("invoices-page")).toBeInTheDocument();
  });

  it("should call logout and redirect on logout click", async () => {
    render(
      <TestWrapper>
        <AppLayout />
      </TestWrapper>
    );
    // Find the logout button - it's the ActionIcon containing the logout icon
    const buttons = screen.getAllByRole("button");
    // The logout button is rendered after the NavLink items in the navbar header
    const logoutBtn = buttons.find((b) => b.querySelector(".tabler-icon-logout"));
    expect(logoutBtn).toBeTruthy();
    fireEvent.click(logoutBtn!);
    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});
