## ADDED Requirements

### Requirement: Backend provides a CSV preview endpoint
The system SHALL expose a `POST /api/members/preview-csv` endpoint that accepts a CSV file and a column mapping, parses all rows using that mapping, cross-references each row against the existing member DB, and returns a list of preview rows without writing anything to the database.

Each preview row SHALL include:
- the parsed field values (firstName, lastName, fiscalCode, etc.)
- a `rowStatus` field: `"new"` (fiscal code not in DB), `"update"` (fiscal code exists), or `"skip"` (fiscal code empty or row invalid)
- a `rowNumber` (1-based, excluding the header row)

The endpoint SHALL return a 400 error if no column is mapped to `fiscalCode`.

The endpoint SHALL cap the preview at 5 000 data rows; if the file contains more rows, the response SHALL include a `truncated: true` flag and a `totalRows` count.

#### Scenario: Successful preview with mixed row statuses
- **WHEN** the client POSTs a CSV file with valid mapping
- **THEN** the endpoint returns HTTP 200 with a list of preview rows, each tagged as "new", "update", or "skip"

#### Scenario: Missing fiscalCode mapping rejected
- **WHEN** the client POSTs a mapping that does not include `fiscalCode`
- **THEN** the endpoint returns HTTP 400 with an Italian error message

#### Scenario: File exceeds 5 000 rows
- **WHEN** the uploaded CSV contains more than 5 000 data rows
- **THEN** the response includes the first 5 000 rows and sets `truncated: true` and `totalRows` to the actual row count

#### Scenario: Empty or blank rows skipped
- **WHEN** a row in the CSV is blank or contains only whitespace
- **THEN** the row is excluded from the preview response (not counted as "skip")

### Requirement: Frontend shows a preview table before confirming
The system SHALL display the preview rows in a paginated table (max 50 rows per page) inside the import wizard step 3. Each row SHALL show the member fields and a status badge (Nuovo / Aggiornamento / Saltato). Summary counters (new / update / skip totals) SHALL be shown above the table.

#### Scenario: Preview table rendered
- **WHEN** the user advances to step 3 of the import wizard
- **THEN** the system shows a table with one row per CSV data row, each displaying parsed fields and a colored status badge

#### Scenario: Summary counters shown
- **WHEN** the preview table is rendered
- **THEN** summary counts for "Nuovi", "Aggiornamenti", and "Saltati" rows are displayed above the table

#### Scenario: Truncation warning shown
- **WHEN** the server returns `truncated: true`
- **THEN** a warning alert informs the user that only the first 5 000 rows are shown and the full file will be imported on confirm
