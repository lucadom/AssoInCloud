## 1. Utility

- [x] 1.1 Create `apps/frontend/src/lib/date-utils.ts` with the `toDateString` helper function

## 2. Type Fix

- [x] 2.1 Update `MemberFormValues.birthDate` and `membershipDate` in `member-form-modal.tsx` from `Date | null` to `DateValue` (imported from `@mantine/dates`)

## 3. Submit Handler Fix

- [x] 3.1 Import `toDateString` in `members-page.tsx` and replace the two unsafe `.toISOString()` calls with `toDateString()`

## 4. Tests

- [x] 4.1 Create `apps/frontend/src/lib/date-utils.test.ts` with unit tests for `toDateString` (null, undefined, string, Date)
- [x] 4.2 Add submit-with-string-date and submit-with-Date tests to `member-form-modal.test.tsx` (or a new `members-page.test.tsx`) that reproduce the bug scenario and verify the fix
- [x] 4.3 Run `npm run test:run` and verify all tests pass
- [x] 4.4 Run `npm run coverage` and verify coverage ≥ 70%
- [x] 4.5 Run `npm run build` and verify the frontend compiles without errors
