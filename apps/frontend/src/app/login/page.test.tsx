import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TestWrapper } from "@/test-utils";

// Mock next/navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock auth module
vi.mock("@/lib/api/auth", () => ({
  login: vi.fn(),
  fetchAuthStatus: vi.fn(),
}));

import { login, fetchAuthStatus } from "@/lib/api/auth";
import LoginPage from "./page";

const mockLogin = vi.mocked(login);
const mockFetchAuthStatus = vi.mocked(fetchAuthStatus);

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: auth is enabled
    mockFetchAuthStatus.mockResolvedValue({ authEnabled: true });
  });

  it("should show loader while checking auth status", () => {
    // Make fetchAuthStatus never resolve during this test
    mockFetchAuthStatus.mockReturnValue(new Promise(() => {}));
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );
    // The loader should be present (a Mantine Loader)
    expect(document.querySelector(".mantine-Loader-root")).toBeInTheDocument();
  });

  it("should redirect when auth is disabled", async () => {
    mockFetchAuthStatus.mockResolvedValue({ authEnabled: false });
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  it("should show login form when auth is enabled", async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("AssoInCloud")).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("Password di accesso")).toBeInTheDocument();
    expect(screen.getByText("Accedi")).toBeInTheDocument();
  });

  it("should show instructions text", async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(
        screen.getByText(/Inserisci la password per accedere/)
      ).toBeInTheDocument();
    });
  });

  it("should call login and redirect on success", async () => {
    mockLogin.mockResolvedValue("fake-token");
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Password di accesso")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Password di accesso"), {
      target: { value: "my-password" },
    });
    fireEvent.submit(screen.getByText("Accedi").closest("form")!);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("my-password");
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("should show error on login failure", async () => {
    mockLogin.mockRejectedValue(new Error("Password non valida"));
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Password di accesso")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Password di accesso"), {
      target: { value: "wrong" },
    });
    fireEvent.submit(screen.getByText("Accedi").closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Password non valida")).toBeInTheDocument();
    });
  });

  it("should show generic error on non-Error exception", async () => {
    mockLogin.mockRejectedValue("unexpected");
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Password di accesso")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Password di accesso"), {
      target: { value: "test" },
    });
    fireEvent.submit(screen.getByText("Accedi").closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Errore durante il login")).toBeInTheDocument();
    });
  });

  it("should show login form if fetchAuthStatus fails", async () => {
    mockFetchAuthStatus.mockRejectedValue(new Error("Network error"));
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("AssoInCloud")).toBeInTheDocument();
    });
  });
});
