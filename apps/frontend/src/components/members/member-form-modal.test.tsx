import { render, screen, waitFor } from "@testing-library/react";
import dayjs from "dayjs";
import { MemberFormModal } from "./member-form-modal";
import { TestWrapper } from "@/test-utils";
import type { Member } from "@/types";

describe("MemberFormModal", () => {
  beforeEach(() => {
    // Only fake Date so waitFor still works with real setTimeout/setInterval
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 1, 13, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows today's date by default for new member", async () => {
    render(
      <MemberFormModal
        opened
        member={null}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
      { wrapper: TestWrapper }
    );

    // DatePickerInput renders as a button; check its text content
    const button = screen.getByLabelText("Data accettazione socio");
    await waitFor(() => {
      expect(button).toHaveTextContent(dayjs(new Date(2026, 1, 13, 12, 0, 0)).format("DD/MM/YYYY"));
    });
  });

  it("uses member date when editing", async () => {
    const member: Member = {
      id: "member-1",
      lastName: "Rossi",
      firstName: "Mario",
      birthDate: null,
      birthPlace: null,
      fiscalCode: "RSSMRA80A01H501U",
      address: null,
      city: null,
      phone: null,
      membershipDate: "2024-01-02T12:00:00",
      membershipYears: [2024, 2026],
      active: true,
    };

    render(
      <MemberFormModal
        opened
        member={member}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
      { wrapper: TestWrapper }
    );

    const button = screen.getByLabelText("Data accettazione socio");
    await waitFor(() => {
      expect(button).toHaveTextContent("02/01/2024");
    });
  });
});
