import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CsvUploadModal } from "./csv-upload-modal";
import { TestWrapper } from "@/test-utils";

describe("Members CsvUploadModal", () => {
  it("should show the expected CSV format in the popover", async () => {
    const onClose = vi.fn();
    const onUpload = vi.fn();

    render(
      <TestWrapper>
        <CsvUploadModal opened={true} onClose={onClose} onUpload={onUpload} />
      </TestWrapper>
    );

    expect(screen.getByText("Carica CSV Soci")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Formato CSV"));
    await waitFor(() => {
      expect(
        screen.getByText(
          "Cognome;Nome;Codice fiscale;Data di nascita;Nato a;Residenza;Citta;Telefono;Data accettazione"
        )
      ).toBeInTheDocument();
    });
  });
});
