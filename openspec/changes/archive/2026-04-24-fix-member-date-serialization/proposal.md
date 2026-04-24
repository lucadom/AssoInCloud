## Why

When a user creates or edits a member with a birth date or membership date selected via `DatePickerInput`, saving the form throws `e.birthDate?.toISOString is not a function` and the backend is never called. The root cause is that Mantine 8's `DatePickerInput` returns `DateValue = string | Date | null` — when a date is picked from the calendar the value is a `YYYY-MM-DD` string, not a `Date` object, so `.toISOString()` is not available.

## What Changes

- Update `MemberFormValues.birthDate` and `MemberFormValues.membershipDate` types from `Date | null` to `DateValue` (`string | Date | null`) to correctly reflect what Mantine's `DatePickerInput` produces.
- Introduce a `toDateString` utility that safely converts either a `Date` or a `YYYY-MM-DD` string to a `YYYY-MM-DD` string, replacing the unsafe `.toISOString()` calls in the form submit handler.
- Add unit tests for `toDateString` and integration tests covering form submission with both date types (string and Date), verifying the bug scenario is reproduced and fixed.

## Capabilities

### New Capabilities
- `member-date-serialization`: Safe conversion of `DatePickerInput` values (`Date | string | null`) to `YYYY-MM-DD` strings for the member create/update API payload.

### Modified Capabilities

_(none — no existing spec-level requirements change)_

## Impact

- `apps/frontend/src/components/members/member-form-modal.tsx` — type change for `MemberFormValues`
- `apps/frontend/src/components/members-page.tsx` — fix `handleFormSubmit` date conversion
- `apps/frontend/src/lib/date-utils.ts` — new utility (new file)
- `apps/frontend/src/lib/date-utils.test.ts` — new test file
