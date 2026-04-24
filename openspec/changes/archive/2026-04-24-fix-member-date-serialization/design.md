## Context

Mantine 8 changed the internal date representation of `DatePickerInput`. The component's `onChange` now returns `DateValue = DateStringValue | Date | null`, where `DateStringValue` is a `YYYY-MM-DD` string. Previously, `MemberFormValues.birthDate` and `membershipDate` were typed as `Date | null` and the submit handler called `.toISOString()` unconditionally. Because a string does not have `toISOString()`, submitting the form with a date picked from the calendar crashes at runtime.

## Goals / Non-Goals

**Goals:**
- Fix the runtime crash by handling both `Date` and `string` inputs in the submit handler.
- Align the form value types with what Mantine 8 actually produces.
- Add tests that cover the bug scenario (date as string) and the existing scenario (date as Date).

**Non-Goals:**
- Normalising dates to a specific timezone (existing `.toISOString()` behaviour is preserved for Date objects).
- Changing date storage or API contract.

## Decisions

**Introduce a `toDateString(value)` utility** (`src/lib/date-utils.ts`):
- If `value` is `null` or `undefined` → return `undefined`.
- If `value` is a string → return it as-is (Mantine already formats it as `YYYY-MM-DD`).
- If `value` is a `Date` → return `value.toISOString().split("T")[0]` (existing behaviour).

This isolates the conversion logic, makes it unit-testable in isolation, and avoids scattering type guards across the component.

**Update `MemberFormValues`** to use `DateValue` from `@mantine/dates` for `birthDate` and `membershipDate`, ensuring TypeScript correctness and removing the implicit assumption that the picker always returns a native `Date`.

*Alternatives considered*: inline the type guard directly in `handleFormSubmit` — rejected because it would be harder to test and would duplicate the logic if the pattern is used elsewhere.

## Risks / Trade-offs

- [Risk] `toISOString()` on a `Date` uses UTC, which may shift the date by one day for users in negative-offset timezones → Not introduced by this fix (pre-existing behaviour, out of scope).
- [Risk] String value from Mantine may include time component in future versions → Mitigated by `.split("T")[0]` on the string path (defensive slicing).

## Migration Plan

No data migration needed. Pure frontend fix; no API contract changes. Deployed as a normal frontend build.
