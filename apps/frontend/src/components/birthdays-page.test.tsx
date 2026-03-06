import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BirthdaysPage } from "./birthdays-page";
import { TestWrapper } from "@/test-utils";
import type { Member } from "@/types";

vi.mock("@/lib/api/members", () => ({
  fetchMembers: vi.fn(),
}));

vi.mock("@mantine/notifications", () => ({
  notifications: {
    show: vi.fn(),
  },
}));

import * as api from "@/lib/api/members";

const mockFetchMembers = vi.mocked(api.fetchMembers);

describe("BirthdaysPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render title", () => {
    mockFetchMembers.mockResolvedValue([]);
    render(
      <TestWrapper>
        <BirthdaysPage />
      </TestWrapper>
    );
    expect(screen.getByText("Compleanni")).toBeInTheDocument();
  });

  it("should call fetchMembers on mount", async () => {
    mockFetchMembers.mockResolvedValue([]);
    render(
      <TestWrapper>
        <BirthdaysPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(mockFetchMembers).toHaveBeenCalledTimes(1);
    });
  });

  it("should render birthday summary", async () => {
    const members: Member[] = [
      {
        id: "m1",
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
    ];
    mockFetchMembers.mockResolvedValue(members);
    render(
      <TestWrapper>
        <BirthdaysPage />
      </TestWrapper>
    );
    await waitFor(() => {
      // BirthdaysSummary renders upcoming birthdays by member name;
      // the date format in the step label depends on Intl, so we check the name.
      expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
    });
  });

  it("should show error notification on load failure", async () => {
    const { notifications } = await import("@mantine/notifications");
    mockFetchMembers.mockRejectedValue(new Error("Network error"));
    render(
      <TestWrapper>
        <BirthdaysPage />
      </TestWrapper>
    );
    await waitFor(() => {
      expect(notifications.show).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Errore",
          color: "red",
        })
      );
    });
  });
});
