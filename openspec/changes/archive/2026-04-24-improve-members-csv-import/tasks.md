## 1. Backend DTOs and validation

- [x] 1.1 Create `CsvColumnMappingDto` record: `{ String csvHeader, String memberField }` (memberField nullable)
- [x] 1.2 Create `CsvImportOptionsDto` record: `{ List<CsvColumnMappingDto> mapping, boolean markAsActive }`
- [x] 1.3 Create `CsvPreviewRowDto` record: `{ int rowNumber, String rowStatus, String firstName, String lastName, String fiscalCode, String birthDate, String birthPlace, String address, String city, String phone, String membershipDate }`
- [x] 1.4 Create `CsvPreviewResponseDto` record: `{ List<CsvPreviewRowDto> rows, boolean truncated, int totalRows }`

## 2. Backend service methods

- [x] 2.1 Add `previewCsv(MultipartFile file, List<CsvColumnMappingDto> mapping)` method to `MemberService` — parses CSV using mapping, queries DB for each fiscal code, returns `CsvPreviewResponseDto` (cap at 5 000 rows, set `truncated` flag)
- [x] 2.2 Add `confirmCsvImport(MultipartFile file, CsvImportOptionsDto options)` method to `MemberService` — parses CSV using mapping, upserts members, optionally adds current-year `MembershipYear` for each inserted/updated member
- [x] 2.3 Extract a shared private helper `parseCsvRows(BufferedReader, List<CsvColumnMappingDto>)` used by both methods to avoid duplication
- [x] 2.4 Add mapping validation helper: throws `IllegalArgumentException` (Italian message) if no column maps to `fiscalCode`

## 3. Backend controller endpoints

- [x] 3.1 Add `POST /api/members/preview-csv` endpoint in `MemberController` — accepts `file` (multipart) and `mapping` (JSON request param or multipart field), returns `CsvPreviewResponseDto`
- [x] 3.2 Add `POST /api/members/confirm-csv-import` endpoint in `MemberController` — accepts `file` (multipart) and `options` (JSON), returns `ImportResultDto`
- [x] 3.3 Handle `IllegalArgumentException` from mapping validation → return HTTP 400 with Italian error message body

## 4. Backend tests

- [x] 4.1 Write integration tests for `previewCsv`: happy path (mixed new/update/skip), missing fiscalCode mapping → 400, file exceeds 5 000 rows → truncated response
- [x] 4.2 Write integration tests for `confirmCsvImport`: happy path with `markAsActive=false`, happy path with `markAsActive=true` (verify `MembershipYear` created), idempotent `markAsActive` (no duplicate year), missing fiscalCode mapping → 400
- [x] 4.3 Run `./mvnw verify` and confirm all tests pass with coverage ≥ 70%

## 5. Frontend API client

- [x] 5.1 Add TypeScript types `CsvColumnMapping`, `CsvPreviewRow`, `CsvPreviewResponse` to `src/types/index.ts`
- [x] 5.2 Add `previewCsvImport(file: File, mapping: CsvColumnMapping[]): Promise<CsvPreviewResponse>` function in `src/lib/api/members.ts`
- [x] 5.3 Add `confirmCsvImport(file: File, mapping: CsvColumnMapping[], markAsActive: boolean): Promise<ImportResult>` function in `src/lib/api/members.ts`

## 6. Frontend wizard component

- [x] 6.1 Create `CsvImportWizard` component at `src/components/members/csv-import-wizard.tsx` with Mantine `Stepper` (3 steps: Carica, Mappa colonne, Anteprima)
- [x] 6.2 Implement Step 1 — file dropzone (reuse existing `Dropzone` setup); on file drop, read CSV headers and advance to step 2
- [x] 6.3 Implement Step 2 — column mapping UI: for each detected header show a `Select` dropdown with member field options and "Ignora" option; auto-map by known Italian header names; show validation error for duplicate field assignments or missing `fiscalCode` mapping; "Avanti" button disabled until mapping is valid
- [x] 6.4 Implement Step 3 — call `previewCsvImport`, render paginated preview table with status badges (Nuovo/Aggiornamento/Saltato), show summary counters, show truncation warning when applicable; add `markAsActive` `Checkbox`; "Conferma importazione" button calls `confirmCsvImport`, shows success/error notification, closes wizard on success
- [x] 6.5 Handle loading and error states in all steps (disable navigation buttons while requests are in-flight)

## 7. Frontend integration

- [x] 7.1 Replace `CsvUploadModal` usage in `members-page.tsx` with `CsvImportWizard`; update props and result handler accordingly

## 8. Frontend tests

- [x] 8.1 Write tests for `CsvImportWizard` Step 1: file drop advances to step 2
- [x] 8.2 Write tests for `CsvImportWizard` Step 2: auto-mapping of known headers, duplicate-field validation error shown, missing fiscalCode blocks "Avanti"
- [x] 8.3 Write tests for `CsvImportWizard` Step 3: preview table renders with correct status badges, summary counters correct, truncation warning shown when truncated, confirm button triggers import and shows success notification
- [x] 8.4 Run `npm run coverage` and confirm all tests pass with coverage ≥ 70%

## 9. Frontend build verification

- [x] 9.1 Run `npm run build` and confirm the build succeeds with no TypeScript errors

## 10. Documentation

- [x] 10.1 Update `AGENTS.md` §5.3 to add the two new endpoints (`/api/members/preview-csv`, `/api/members/confirm-csv-import`)
- [x] 10.2 Update `AGENTS.md` §1 feature table to reflect the enhanced import capability
