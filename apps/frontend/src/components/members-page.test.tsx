import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MembersPage } from "./members-page";
import { TestWrapper } from "@/test-utils";
import type { Member } from "@/types";

vi.mock("@/lib/api/members", () => ({
  fetchMembers: vi.fn(),
  fetchActiveMembers: vi.fn(),
  createMember: vi.fn(),
  updateMember: vi.fn(),
  deleteMember: vi.fn(),
  renewMembership: vi.fn(),
  uploadMembersCsv: vi.fn(),
  exportMembersXlsx: vi.fn(),
  exportActiveMembersXlsx: vi.fn(),
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
}));

// MembersTable and other subcomponents render complex UI; avoid deep testing here.
vi.mock("./members/members-table", () => ({
  MembersTable: ({ members }: { members: Member[] }) => (
    <div data-testid="members-table">{members.length} soci</div>
  ),
}));

vi.mock("./members/member-form-modal", () => ({
  MemberFormModal: ({ opened }: { opened: boolean }) =>
    opened ? <div data-testid="member-form-modal" /> : null,
}));

vi.mock("./members/csv-upload-modal", () => ({
  CsvUploadModal: ({ opened }: { opened: boolean }) =>
    opened ? <div data-testid="csv-upload-modal" /> : null,
}));

vi.mock("./members/delete-confirm-modal", () => ({
  DeleteConfirmModal: ({ opened }: { opened: boolean }) =>
    opened ? <div data-testid="delete-modal" /> : null,
}));

import * as api from "@/lib/api/members";
const mockFetchMembers = vi.mocked(api.fetchMembers);
const mockExportXlsx = vi.mocked(api.exportMembersXlsx);

const members: Member[] = [
  {
    id: "m1",
    lastName: "Rossi",
    firstName: "Marco",
    fiscalCode: "RSSMRC80A01H501U",
    birthDate: null,
    birthPlace: null,
    address: null,
    city: null,
    phone: null,
    membershipDate: null,
    membershipYears: [2024],
    active: false,
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
    membershipYears: [2026],
    active: true,
  },
];

describe("MembersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchMembers.mockResolvedValue(members);
  });

  it("should render the page title", async () => {
    render(
      <TestWrapper>
        <MembersPage />
      </TestWrapper>
    );
    expect(screen.getByText("Soci")).toBeInTheDocument();
  });

  it("should render action buttons", async () => {
    render(
      <TestWrapper>
        <MembersPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByText("Nuovo socio")).toBeInTheDocument();
      expect(screen.getByText("Carica CSV")).toBeInTheDocument();
      expect(screen.getByText("Esporta XLSX")).toBeInTheDocument();
    });
  });

  it("should load and display members", async () => {
    render(
      <TestWrapper>
        <MembersPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(screen.getByTestId("members-table")).toBeInTheDocument();
      expect(screen.getByText("2 soci")).toBeInTheDocument();
    });
    expect(mockFetchMembers).toHaveBeenCalled();
  });

  it("should show error notification when loading fails", async () => {
    const { notifications } = await import("@mantine/notifications");
    mockFetchMembers.mockRejectedValueOnce(new Error("Network error"));
    render(
      <TestWrapper>
        <MembersPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({ color: "red" })
      );
    });
  });

  it("should call exportMembersXlsx on export button click", async () => {
    mockExportXlsx.mockResolvedValueOnce(new Blob(["xlsx"]));
    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn().mockReturnValue("blob:mock"),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
    render(
      <TestWrapper>
        <MembersPage />
      </TestWrapper>
    );
    await waitFor(() => screen.getByText("Esporta XLSX"));
    screen.getByText("Esporta XLSX").click();
    await waitFor(() => {
      expect(mockExportXlsx).toHaveBeenCalled();
    });
  });
});
