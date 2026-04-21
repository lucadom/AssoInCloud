import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BulkActionToolbar } from "../bulk-action-toolbar";
import { MantineProvider } from "@mantine/core";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe("BulkActionToolbar", () => {
  it("renders nothing when selectedCount is 0", () => {
    const { container } = render(
      <BulkActionToolbar selectedCount={0} onMove={vi.fn()} onDelete={vi.fn()} onDownload={vi.fn()} />,
      { wrapper }
    );
    // MantineProvider injects a style tag; the toolbar itself should not render any content
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("p")).toBeNull();
  });

  it("shows count and buttons when files selected", () => {
    render(
      <BulkActionToolbar selectedCount={3} onMove={vi.fn()} onDelete={vi.fn()} onDownload={vi.fn()} />,
      { wrapper }
    );
    expect(screen.getByText("3 file selezionati")).toBeInTheDocument();
    expect(screen.getByText("Sposta")).toBeInTheDocument();
    expect(screen.getByText("Elimina")).toBeInTheDocument();
    expect(screen.getByText("Scarica come ZIP")).toBeInTheDocument();
  });

  it("calls onDelete when Elimina clicked", () => {
    const onDelete = vi.fn();
    render(
      <BulkActionToolbar selectedCount={2} onMove={vi.fn()} onDelete={onDelete} onDownload={vi.fn()} />,
      { wrapper }
    );
    fireEvent.click(screen.getByText("Elimina"));
    expect(onDelete).toHaveBeenCalled();
  });

  it("shows singular label for 1 file", () => {
    render(
      <BulkActionToolbar selectedCount={1} onMove={vi.fn()} onDelete={vi.fn()} onDownload={vi.fn()} />,
      { wrapper }
    );
    expect(screen.getByText("1 file selezionato")).toBeInTheDocument();
  });
});
