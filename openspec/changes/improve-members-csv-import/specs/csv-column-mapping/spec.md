## ADDED Requirements

### Requirement: User can map CSV headers to member fields
After uploading a CSV file, the system SHALL detect all column headers in the first row and present a mapping UI where the user can assign each header to one of the known member fields or mark it as ignored.

Known member fields: `lastName`, `firstName`, `fiscalCode`, `birthDate`, `birthPlace`, `address`, `city`, `phone`, `membershipDate`.

The mapping SHALL be represented as an ordered list of `{ csvHeader: string, memberField: string | null }` pairs where `null` means the column is ignored.

#### Scenario: Headers detected and shown
- **WHEN** the user uploads a valid CSV file with a header row
- **THEN** the system displays each column header with a dropdown to select the target member field or "Ignora"

#### Scenario: Auto-mapping by header name
- **WHEN** a CSV column header matches a known Italian field label (e.g., "Cognome" → `lastName`, "Codice fiscale" → `fiscalCode`)
- **THEN** the system pre-selects the corresponding member field in the dropdown

#### Scenario: Duplicate field mapping rejected
- **WHEN** the user assigns the same member field to two different CSV columns
- **THEN** the system displays an inline validation error and disables the "Avanti" button until the conflict is resolved

#### Scenario: Missing fiscalCode mapping blocked
- **WHEN** the user tries to proceed to the preview step without mapping any column to `fiscalCode`
- **THEN** the system displays an error message and prevents advancing

#### Scenario: Unknown or extra columns ignored
- **WHEN** a CSV column header does not match any known field and the user leaves it as "Ignora"
- **THEN** the column is silently excluded from the import with no error

#### Scenario: CSV has no header row
- **WHEN** the uploaded CSV file has no recognizable header row (first row contains non-text values or the file is empty)
- **THEN** the system displays an error message asking the user to verify the file format and does not advance to the mapping step
