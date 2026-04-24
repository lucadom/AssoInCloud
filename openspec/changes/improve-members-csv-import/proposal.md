## Why

The current CSV import for members uses a fixed column order and imports blindly without user confirmation. This makes it fragile (any CSV with different column ordering breaks silently), prevents users from catching data errors before commit, and offers no way to mark imported members as active for the current year in one step.

## What Changes

- **Column mapping step**: after uploading a CSV, the user can map each detected CSV header to a member field (or ignore it), replacing the current hardcoded positional mapping.
- **Preview & confirm step**: before the actual import is committed, show a paginated table of parsed rows with per-row status (new / update / skip) so the user can verify the data looks correct and cancel if needed.
- **Import as active option**: a checkbox lets the user choose whether to add the current membership year to all inserted and updated members, making them active in one step.
- The backend `POST /api/members/import-csv` endpoint is split into two calls:
  - `POST /api/members/preview-csv` — parses the file with a provided column mapping and returns the preview rows (no DB writes).
  - `POST /api/members/confirm-csv-import` — receives the parsed data + options (mapping, markAsActive) and performs the actual upsert.

## Capabilities

### New Capabilities

- `csv-column-mapping`: UI step that reads CSV headers and lets the user map each column to a member field (lastName, firstName, fiscalCode, birthDate, birthPlace, address, city, phone, membershipDate) or mark it as ignored.
- `csv-import-preview`: Backend endpoint and frontend review step that parses the CSV according to the user-supplied mapping and returns a preview of rows (with new/update/skip classification) before any data is written.
- `csv-import-confirm`: Backend endpoint that accepts the mapping and options (including `markAsActive`) and performs the actual upsert, optionally creating a `MembershipYear` for the current year for every inserted/updated member.

### Modified Capabilities

*(none — no existing spec files to delta)*

## Impact

- **Backend**: `MemberService` gains `previewCsv` and `confirmCsvImport` methods; new DTOs (`CsvColumnMappingDto`, `CsvPreviewRowDto`, `CsvImportOptionsDto`); new controller endpoints `POST /api/members/preview-csv` and `POST /api/members/confirm-csv-import`. The existing `POST /api/members/import-csv` endpoint is kept for backward compatibility but deprecated.
- **Frontend**: `CsvUploadModal` is replaced by a multi-step modal (`CsvImportWizard`): step 1 = file upload, step 2 = column mapping, step 3 = preview + options + confirm.
- **API**: Two new endpoints added; existing endpoint unchanged.
- **Tests**: New integration tests for `previewCsv` and `confirmCsvImport`; new frontend component tests for the wizard steps.
