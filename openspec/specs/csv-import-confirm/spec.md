## ADDED Requirements

### Requirement: Backend provides a CSV confirm-import endpoint
The system SHALL expose a `POST /api/members/confirm-csv-import` endpoint that accepts a CSV file, a column mapping, and an options object (`markAsActive: boolean`). It SHALL upsert all valid rows (insert new members, update existing members by fiscal code) and return an `ImportResultDto` with `imported`, `updated`, and `skipped` counts.

If `markAsActive` is `true`, the system SHALL ensure that a `MembershipYear` record for the current calendar year exists for every inserted or updated member (idempotent — no duplicate years created).

The endpoint SHALL return a 400 error if no column is mapped to `fiscalCode`.

#### Scenario: Successful import with new and existing members
- **WHEN** the client POSTs a valid CSV, mapping, and `markAsActive: false`
- **THEN** the endpoint upserts all rows, returns HTTP 200 with correct `imported`, `updated`, `skipped` counts, and does NOT create membership year records

#### Scenario: Import with markAsActive true
- **WHEN** the client POSTs a valid CSV, mapping, and `markAsActive: true`
- **THEN** for every inserted and updated member, a `MembershipYear` for the current year is created if it does not already exist, and the response counts are correct

#### Scenario: markAsActive is idempotent
- **WHEN** `markAsActive: true` and a member already has a `MembershipYear` for the current year
- **THEN** no duplicate `MembershipYear` record is created and the member is counted as "updated" normally

#### Scenario: Missing fiscalCode mapping rejected on confirm
- **WHEN** the client POSTs a mapping without `fiscalCode`
- **THEN** the endpoint returns HTTP 400 with an Italian error message

#### Scenario: Row without fiscal code skipped
- **WHEN** a CSV row has an empty or blank value in the `fiscalCode` column
- **THEN** the row is counted as `skipped` and no member record is written

### Requirement: Frontend confirm button triggers import and shows result
The system SHALL show a "Conferma importazione" button in wizard step 3. Clicking it SHALL call the confirm endpoint, close the wizard on success, and show a Mantine notification summarizing the import result. On failure it SHALL show an error notification with the server error message.

#### Scenario: Successful import notification
- **WHEN** the confirm endpoint returns HTTP 200
- **THEN** a success notification shows "X soci importati, Y aggiornati, Z saltati"

#### Scenario: Failed import notification
- **WHEN** the confirm endpoint returns an error
- **THEN** an error notification shows the Italian error message from the server

#### Scenario: Loading state during import
- **WHEN** the confirm button is clicked and the request is in-flight
- **THEN** the button shows a loading spinner and is disabled to prevent double-submission
