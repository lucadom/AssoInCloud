import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BreadcrumbNav } from "../breadcrumb-nav";
import { MantineProvider } from "@mantine/core";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe("BreadcrumbNav", () => {
  it("renders root link", () => {
    render(<BreadcrumbNav path="" onNavigate={vi.fn()} />, { wrapper });
    expect(screen.getByText("Documenti")).toBeInTheDocument();
  });

  it("renders path segments", () => {
    render(<BreadcrumbNav path="Verbali/2024" onNavigate={vi.fn()} />, { wrapper });
    expect(screen.getByText("Verbali")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("calls onNavigate when root clicked", () => {
    const onNavigate = vi.fn();
    render(<BreadcrumbNav path="Verbali" onNavigate={onNavigate} />, { wrapper });
    screen.getByText("Documenti").click();
    expect(onNavigate).toHaveBeenCalledWith("");
  });

  it("renders intermediate segment as clickable link", () => {
    render(<BreadcrumbNav path="A/B/C" onNavigate={vi.fn()} />, { wrapper });
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("calls onNavigate with intermediate path when middle segment clicked", () => {
    const onNavigate = vi.fn();
    render(<BreadcrumbNav path="A/B/C" onNavigate={onNavigate} />, { wrapper });
    screen.getByText("A").click();
    expect(onNavigate).toHaveBeenCalledWith("A");
  });
});
