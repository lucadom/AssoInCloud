import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteConfirmModal } from "./delete-confirm-modal";
import { TestWrapper } from "@/test-utils";
import type { Member } from "@/types";

const member: Member = {
  id: "m1",
  lastName: "Rossi",
  firstName: "Marco",
  fiscalCode: "RSSMRC80A01H501U",
};

describe("DeleteConfirmModal", () => {
  it("should render null when member is null", () => {
    render(
      <TestWrapper>
        <DeleteConfirmModal
          member={null}
          opened={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      </TestWrapper>
    );
    expect(screen.queryByText("Conferma eliminazione")).not.toBeInTheDocument();
  });

  it("should render confirmation text with member name when opened", () => {
    render(
      <TestWrapper>
        <DeleteConfirmModal
          member={member}
          opened={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      </TestWrapper>
    );
    expect(screen.getByText(/Marco/)).toBeInTheDocument();
    expect(screen.getByText(/Rossi/)).toBeInTheDocument();
  });

  it("should call onConfirm when Elimina button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <TestWrapper>
        <DeleteConfirmModal
          member={member}
          opened={true}
          onClose={vi.fn()}
          onConfirm={onConfirm}
        />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Elimina"));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("should call onClose when Annulla button is clicked", () => {
    const onClose = vi.fn();
    render(
      <TestWrapper>
        <DeleteConfirmModal
          member={member}
          opened={true}
          onClose={onClose}
          onConfirm={vi.fn()}
        />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Annulla"));
    expect(onClose).toHaveBeenCalled();
  });
});
