import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RenameModal } from "../rename-modal";
import { MantineProvider } from "@mantine/core";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe("RenameModal", () => {
  it("renders with current name pre-filled", () => {
    render(
      <RenameModal opened={true} currentName="report.pdf" itemType="file" onClose={vi.fn()} onConfirm={vi.fn()} />,
      { wrapper }
    );
    const input = screen.getByDisplayValue("report.pdf");
    expect(input).toBeInTheDocument();
  });

  it("renders with folder title for folder type", () => {
    render(
      <RenameModal opened={true} currentName="Verbali" itemType="folder" onClose={vi.fn()} onConfirm={vi.fn()} />,
      { wrapper }
    );
    expect(screen.getByText("Rinomina cartella")).toBeInTheDocument();
  });

  it("renders with file title for file type", () => {
    render(
      <RenameModal opened={true} currentName="doc.pdf" itemType="file" onClose={vi.fn()} onConfirm={vi.fn()} />,
      { wrapper }
    );
    expect(screen.getByText("Rinomina file")).toBeInTheDocument();
  });

  it("shows error for empty name", async () => {
    render(
      <RenameModal opened={true} currentName="test" itemType="file" onClose={vi.fn()} onConfirm={vi.fn()} />,
      { wrapper }
    );
    const input = screen.getByDisplayValue("test");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByText("Rinomina"));
    await waitFor(() => {
      expect(screen.getByText("Il nome non può essere vuoto")).toBeInTheDocument();
    });
  });

  it("calls onConfirm with trimmed name", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <RenameModal opened={true} currentName="old.txt" itemType="file" onClose={vi.fn()} onConfirm={onConfirm} />,
      { wrapper }
    );
    const input = screen.getByDisplayValue("old.txt");
    fireEvent.change(input, { target: { value: "  new.txt  " } });
    fireEvent.click(screen.getByText("Rinomina"));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("new.txt"));
  });
});
