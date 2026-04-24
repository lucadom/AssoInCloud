/**
 * Tests specifically for the handleFormSubmit date serialization bug.
 * Mantine 8 DatePickerInput can return a string (DateStringValue) instead of
 * a Date object; this test suite verifies the form handler handles both cases.
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MembersPage } from "./members-page";
import { TestWrapper } from "@/test-utils";
import type { Member } from "@/types";
import type { MemberFormValues } from "./members/member-form-modal";

// Capture the onSubmit prop so tests can trigger it directly
let capturedOnSubmit: ((values: MemberFormValues) => void) | null = null;

vi.mock("./members/member-form-modal", () => ({
  MemberFormModal: ({
    opened,
    onSubmit,
  }: {
    opened: boolean;
    onSubmit: (values: MemberFormValues) => void;
  }) => {
    capturedOnSubmit = onSubmit;
    return opened ? (
      <div data-testid="member-form-modal">
        <button
          data-testid="submit-form"
          onClick={() => {
            if (onSubmit) {
              onSubmit({
                lastName: "Verdi",
                firstName: "Luigi",
                fiscalCode: "VRDLGU90A01H501U",
                birthDate: "2024-03-10",
                birthPlace: "",
                address: "",
                city: "",
                phone: "",
                membershipDate: "2024-03-10",
                membershipYears: [],
              });
            }
          }}
        />
      </div>
    ) : null;
  },
}));

vi.mock("./members/members-table", () => ({
  MembersTable: ({ members }: { members: Member[] }) => (
    <div data-testid="members-table">{members.length} soci</div>
  ),
}));

vi.mock("./members/csv-import-wizard", () => ({
  CsvImportWizard: () => null,
}));

vi.mock("./members/delete-confirm-modal", () => ({
  DeleteConfirmModal: () => null,
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: vi.fn() },
}));

vi.mock("@/lib/api/members", () => ({
  fetchMembers: vi.fn(),
  createMember: vi.fn(),
  updateMember: vi.fn(),
  deleteMember: vi.fn(),
  renewMembership: vi.fn(),
  uploadMembersCsv: vi.fn(),
  exportMembersXlsx: vi.fn(),
  exportActiveMembersXlsx: vi.fn(),
}));

import * as api from "@/lib/api/members";
const mockFetchMembers = vi.mocked(api.fetchMembers);
const mockCreateMember = vi.mocked(api.createMember);

const newMember: Member = {
  id: "new-1",
  lastName: "Verdi",
  firstName: "Luigi",
  fiscalCode: "VRDLGU90A01H501U",
  birthDate: "2024-03-10",
  birthPlace: null,
  address: null,
  city: null,
  phone: null,
  membershipDate: "2024-03-10",
  membershipYears: [],
  active: false,
};

describe("MembersPage — handleFormSubmit date serialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedOnSubmit = null;
    mockFetchMembers.mockResolvedValue([]);
    mockCreateMember.mockResolvedValue(newMember);
  });

  it("calls createMember with YYYY-MM-DD string when dates are strings (bug regression)", async () => {
    render(
      <TestWrapper>
        <MembersPage />
      </TestWrapper>
    );

    // Open the form modal
    const newButton = await screen.findByText("Nuovo socio");
    fireEvent.click(newButton);

    // Submit via the captured onSubmit with string dates (as Mantine 8 returns)
    await waitFor(() => expect(capturedOnSubmit).not.toBeNull());
    await capturedOnSubmit!({
      lastName: "Verdi",
      firstName: "Luigi",
      fiscalCode: "VRDLGU90A01H501U",
      birthDate: "2024-03-10",
      birthPlace: "",
      address: "",
      city: "",
      phone: "",
      membershipDate: "2024-03-10",
      membershipYears: [],
    });

    await waitFor(() => {
      expect(mockCreateMember).toHaveBeenCalledWith(
        expect.objectContaining({
          birthDate: "2024-03-10",
          membershipDate: "2024-03-10",
        })
      );
    });
  });

  it("calls createMember with YYYY-MM-DD string when dates are Date objects (legacy)", async () => {
    render(
      <TestWrapper>
        <MembersPage />
      </TestWrapper>
    );

    const newButton = await screen.findByText("Nuovo socio");
    fireEvent.click(newButton);

    await waitFor(() => expect(capturedOnSubmit).not.toBeNull());
    // Use a noon-UTC Date to avoid timezone-induced day shifts
    await capturedOnSubmit!({
      lastName: "Verdi",
      firstName: "Luigi",
      fiscalCode: "VRDLGU90A01H501U",
      birthDate: new Date("2024-03-10T12:00:00.000Z"),
      birthPlace: "",
      address: "",
      city: "",
      phone: "",
      membershipDate: new Date("2024-03-10T12:00:00.000Z"),
      membershipYears: [],
    });

    await waitFor(() => {
      expect(mockCreateMember).toHaveBeenCalledWith(
        expect.objectContaining({
          birthDate: "2024-03-10",
          membershipDate: "2024-03-10",
        })
      );
    });
  });

  it("calls createMember without date fields when dates are null", async () => {
    render(
      <TestWrapper>
        <MembersPage />
      </TestWrapper>
    );

    const newButton = await screen.findByText("Nuovo socio");
    fireEvent.click(newButton);

    await waitFor(() => expect(capturedOnSubmit).not.toBeNull());
    await capturedOnSubmit!({
      lastName: "Verdi",
      firstName: "Luigi",
      fiscalCode: "VRDLGU90A01H501U",
      birthDate: null,
      birthPlace: "",
      address: "",
      city: "",
      phone: "",
      membershipDate: null,
      membershipYears: [],
    });

    await waitFor(() => {
      expect(mockCreateMember).toHaveBeenCalledWith(
        expect.objectContaining({
          birthDate: undefined,
          membershipDate: undefined,
        })
      );
    });
  });
});
