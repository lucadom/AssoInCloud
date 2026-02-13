import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CsvUploadModal } from "./csv-upload-modal";
import { TestWrapper } from "@/test-utils";

describe("CsvUploadModal", () => {
  const onClose = vi.fn();
  const onUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render content when closed", () => {
    render(
      <TestWrapper>
        <CsvUploadModal opened={false} onClose={onClose} onUpload={onUpload} />
      </TestWrapper>
    );
    expect(screen.queryByText("Carica CSV")).not.toBeInTheDocument();
  });

  it("should render title and description when opened", () => {
    render(
      <TestWrapper>
        <CsvUploadModal opened={true} onClose={onClose} onUpload={onUpload} />
      </TestWrapper>
    );
    expect(screen.getByText("Carica CSV")).toBeInTheDocument();
    expect(screen.getByText(/Carica uno o più file CSV contenente/)).toBeInTheDocument();
  });

  it("should render dropzone text", () => {
    render(
      <TestWrapper>
        <CsvUploadModal opened={true} onClose={onClose} onUpload={onUpload} />
      </TestWrapper>
    );
    expect(screen.getByText(/Trascina qui i file CSV/)).toBeInTheDocument();
    expect(screen.getByText(/Sono accettati uno o più file in formato CSV/)).toBeInTheDocument();
  });

  it("should render buttons", () => {
    render(
      <TestWrapper>
        <CsvUploadModal opened={true} onClose={onClose} onUpload={onUpload} />
      </TestWrapper>
    );
    expect(screen.getByText("Annulla")).toBeInTheDocument();
    expect(screen.getByText("Seleziona file")).toBeInTheDocument();
  });

  it("should call onClose when clicking Annulla", () => {
    render(
      <TestWrapper>
        <CsvUploadModal opened={true} onClose={onClose} onUpload={onUpload} />
      </TestWrapper>
    );
    fireEvent.click(screen.getByText("Annulla"));
    expect(onClose).toHaveBeenCalled();
  });

  it("should show loading state", () => {
    render(
      <TestWrapper>
        <CsvUploadModal opened={true} onClose={onClose} onUpload={onUpload} loading={true} />
      </TestWrapper>
    );
    // The "Seleziona file" button should be in loading state
    const button = screen.getByText("Seleziona file").closest("button");
    expect(button).toHaveAttribute("data-loading");
  });

  it("should show the expected CSV format in the popover", () => {
    render(
      <TestWrapper>
        <CsvUploadModal opened={true} onClose={onClose} onUpload={onUpload} />
      </TestWrapper>
    );

    fireEvent.click(screen.getByLabelText("Formato CSV fatture"));
    expect(
      screen.getByText(
        "Tipo documento;Numero fattura;Data;Partita IVA;Fornitore;Imponibile;Imposta;Numero SDI;Fattura visualizzata"
      )
    ).toBeInTheDocument();
  });
});
