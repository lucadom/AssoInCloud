import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MembersTable } from "./members-table";
import { TestWrapper } from "@/test-utils";
import type { Member } from "@/types";

const members: Member[] = [
  {
    id: "m1",
    lastName: "Rossi",
    firstName: "Marco",
    fiscalCode: "RSSMRC80A01H501U",
    birthDate: "1990-05-15",
    birthPlace: "Roma",
    address: "Via Roma 1",
    city: "Roma",
    phone: "3331234567",
    membershipDate: "2020-01-10",
  },
  {
    id: "m2",
    lastName: "Bianchi",
    firstName: "Anna",
    fiscalCode: "BNCHNN85E60D612C",
    birthDate: null,
    birthPlace: null,
    address: null,
    city: null,
    phone: null,
    membershipDate: null,
  },
];

describe("MembersTable", () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render member names", () => {
    render(
      <TestWrapper>
        <MembersTable members={members} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getByText("Rossi")).toBeInTheDocument();
    expect(screen.getByText("Marco")).toBeInTheDocument();
    expect(screen.getByText("Bianchi")).toBeInTheDocument();
    expect(screen.getByText("Anna")).toBeInTheDocument();
  });

  it("should render fiscal codes", () => {
    render(
      <TestWrapper>
        <MembersTable members={members} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getByText("RSSMRC80A01H501U")).toBeInTheDocument();
    expect(screen.getByText("BNCHNN85E60D612C")).toBeInTheDocument();
  });

  it("should render with empty members list", () => {
    render(
      <TestWrapper>
        <MembersTable members={[]} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    // With no members, the table should render without errors
    expect(screen.getByText("Cognome")).toBeInTheDocument();
  });

  it("should render column headers", () => {
    render(
      <TestWrapper>
        <MembersTable members={members} onEdit={onEdit} onDelete={onDelete} />
      </TestWrapper>
    );
    expect(screen.getByText("Cognome")).toBeInTheDocument();
    expect(screen.getByText("Nome")).toBeInTheDocument();
    expect(screen.getByText("Codice Fiscale")).toBeInTheDocument();
  });
});
