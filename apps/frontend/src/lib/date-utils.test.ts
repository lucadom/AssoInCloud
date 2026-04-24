import { toDateString } from "./date-utils";

describe("toDateString", () => {
  it("returns undefined for null", () => {
    expect(toDateString(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(toDateString(undefined)).toBeUndefined();
  });

  it("returns a YYYY-MM-DD string as-is (DateStringValue from DatePickerInput)", () => {
    expect(toDateString("2024-01-15")).toBe("2024-01-15");
  });

  it("strips the time component from a datetime string", () => {
    expect(toDateString("2024-01-15T10:30:00")).toBe("2024-01-15");
  });

  it("converts a Date object to YYYY-MM-DD using UTC date", () => {
    // Use a Date at noon UTC to avoid timezone-induced day shifts
    const date = new Date("2024-03-10T12:00:00.000Z");
    expect(toDateString(date)).toBe("2024-03-10");
  });
});
