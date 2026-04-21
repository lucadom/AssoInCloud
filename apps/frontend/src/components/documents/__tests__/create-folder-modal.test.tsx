import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateFolderModal } from "../create-folder-modal";
import { MantineProvider } from "@mantine/core";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe("CreateFolderModal", () => {
  it("renders input when opened", () => {
    render(
      <CreateFolderModal opened={true} onClose={vi.fn()} onConfirm={vi.fn()} />,
      { wrapper }
    );
    expect(screen.getByPlaceholderText("Inserisci il nome")).toBeInTheDocument();
  });

  it("shows validation error when name is empty", async () => {
    render(
      <CreateFolderModal opened={true} onClose={vi.fn()} onConfirm={vi.fn()} />,
      { wrapper }
    );
    fireEvent.click(screen.getByText("Crea"));
    await waitFor(() => {
      expect(screen.getByText("Il nome non può essere vuoto")).toBeInTheDocument();
    });
  });

  it("calls onConfirm with trimmed name", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <CreateFolderModal opened={true} onClose={vi.fn()} onConfirm={onConfirm} />,
      { wrapper }
    );
    fireEvent.change(screen.getByPlaceholderText("Inserisci il nome"), { target: { value: "  Test  " } });
    fireEvent.click(screen.getByText("Crea"));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("Test"));
  });
});
