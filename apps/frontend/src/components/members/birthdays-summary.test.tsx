import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BirthdaysSummary } from "./birthdays-summary";
import { TestWrapper } from "@/test-utils";
import type { Member } from "@/types";

describe("BirthdaysSummary", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 1, 13, 9, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should show today and future birthdays", () => {
    const members: Member[] = [
      {
        id: "1",
        firstName: "Mario",
        lastName: "Rossi",
        birthDate: "1980-02-10",
        birthPlace: null,
        fiscalCode: "RSSMRA80A01H501U",
        address: null,
        city: null,
        phone: null,
        membershipDate: null,
      },
      {
        id: "2",
        firstName: "Anna",
        lastName: "Verdi",
        birthDate: "1992-02-12",
        birthPlace: null,
        fiscalCode: "VRDANN92B52F205X",
        address: null,
        city: null,
        phone: null,
        membershipDate: null,
      },
      {
        id: "3",
        firstName: "Luca",
        lastName: "Neri",
        birthDate: "1985-02-13",
        birthPlace: null,
        fiscalCode: "NRILCU85C13H501Q",
        address: null,
        city: null,
        phone: null,
        membershipDate: null,
      },
      {
        id: "4",
        firstName: "Sara",
        lastName: "Bianchi",
        birthDate: "1990-02-14",
        birthPlace: null,
        fiscalCode: "BNCSRA90D54F205M",
        address: null,
        city: null,
        phone: null,
        membershipDate: null,
      },
      {
        id: "5",
        firstName: "Paolo",
        lastName: "Bianchi",
        birthDate: "1991-02-14",
        birthPlace: null,
        fiscalCode: "BNCPAO91E14F205P",
        address: null,
        city: null,
        phone: null,
        membershipDate: null,
      },
      {
        id: "6",
        firstName: "Giulia",
        lastName: "Gialli",
        birthDate: "1975-02-20",
        birthPlace: null,
        fiscalCode: "GLLGLI75F60F205H",
        address: null,
        city: null,
        phone: null,
        membershipDate: null,
      },
      {
        id: "7",
        firstName: "Marco",
        lastName: "Blu",
        birthDate: "1988-01-15",
        birthPlace: null,
        fiscalCode: "BLUMRC88A15F205Z",
        address: null,
        city: null,
        phone: null,
        membershipDate: null,
      },
      {
        id: "8",
        firstName: "Irene",
        lastName: "Rosa",
        birthDate: "1999-03-01",
        birthPlace: null,
        fiscalCode: "RSRIRN99C41F205A",
        address: null,
        city: null,
        phone: null,
        membershipDate: null,
      },
    ];

    render(
      <TestWrapper>
        <BirthdaysSummary members={members} />
      </TestWrapper>
    );

    expect(screen.getByText(/Oggi \(Venerd. 13 Febbraio\)/)).toBeInTheDocument();
    expect(screen.getByText(/Sabato 14 Febbraio/)).toBeInTheDocument();
    expect(screen.getByText(/Venerd. 20 Febbraio/)).toBeInTheDocument();
    expect(screen.getByText(/Domenica 1 Marzo/)).toBeInTheDocument();

    expect(screen.getByText("Sara Bianchi - 36 anni")).toBeInTheDocument();
    expect(screen.getByText("Paolo Bianchi - 35 anni")).toBeInTheDocument();
    expect(screen.getByText("Giulia Gialli - 51 anni")).toBeInTheDocument();
    expect(screen.getByText("Irene Rosa - 27 anni")).toBeInTheDocument();

    expect(screen.queryByText(/Marted. 10 Febbraio/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gioved. 12 Febbraio/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Gioved. 15 Gennaio/)).not.toBeInTheDocument();
    expect(screen.queryByText("Mario Rossi - 46 anni")).not.toBeInTheDocument();
    expect(screen.queryByText("Anna Verdi - 34 anni")).not.toBeInTheDocument();
    expect(screen.queryByText("Luca Neri - 41 anni")).not.toBeInTheDocument();
  });
});
