## Context

The current `POST /api/members/import-csv` endpoint accepts a CSV file with a hardcoded column order (`Cognome;Nome;Codice fiscale;Data di nascita;Nato a;Residenza;Citta;Telefono;Data accettazione`). It parses and upserts rows in a single pass with no user confirmation. The frontend shows a simple file-drop modal; once dropped, the file is immediately imported.

This design introduces a three-step import wizard:
1. File upload and header detection.
2. Column-to-field mapping (user-driven).
3. Preview of parsed rows + options (mark as active) + final confirm.

## Goals / Non-Goals

**Goals:**
- Replace hardcoded positional mapping with user-defined header-to-field mapping.
- Give users a row-level preview (new / update / skip) before any DB write.
- Allow users to mark all imported members as active (add current membership year) in one step.
- Preserve the existing `/api/members/import-csv` endpoint for backward compatibility.

**Non-Goals:**
- XLSX import is not affected.
- Row-level editing in the preview (read-only preview only).
- Importing partial rows (rows without a fiscal code are always skipped).
- Changing the CSV separator (semicolon remains the only supported separator).

## Decisions

### D1: Two-endpoint split (preview + confirm) instead of a single dry-run flag

A dedicated `POST /api/members/preview-csv` endpoint returns parsed rows without touching the DB. A separate `POST /api/members/confirm-csv-import` accepts the column mapping and options and performs the actual upsert.

**Why over a single endpoint with `dryRun=true`**: cleaner REST semantics; the preview endpoint is naturally idempotent (GET-like), while confirm is a mutating POST. It also avoids sending the file twice — the preview receives the file + mapping; confirm receives mapping + `markAsActive` flag (no file re-upload needed because the preview already validated the data shape; confirm re-parses the file from a server-held temp reference, *or* the client re-sends the file — see D2).

### D2: Client re-sends the file on confirm (stateless server)

The confirm call re-uploads the same file together with the mapping and `markAsActive` flag. This keeps the server stateless (no temp file storage, no session state). The file is small (typical member list is a few hundred rows), so the overhead is negligible.

**Alternative considered**: store a temp file on the server between preview and confirm — rejected because it adds server-side state, cleanup complexity, and potential temp-file leaks.

### D3: Column mapping is sent as a JSON array of `{csvHeader, memberField}` pairs

The mapping is a list of pairs where `memberField` is one of the known field identifiers or `null` (ignore). This is flexible enough to handle any CSV header name and any number of columns.

**Required**: at least one column must map to `fiscalCode` (server validates and rejects otherwise).

### D4: Frontend multi-step modal (3 steps in a single Modal)

Steps are controlled by a local state index (0 = upload, 1 = mapping, 2 = preview+options). Using Mantine `Stepper` component for visual progress.

### D5: `markAsActive` adds a `MembershipYear` record for the current calendar year

If `markAsActive=true`, after upserting each member the service calls `syncMembershipYears` to ensure the current year is present. Members who already have the current year are unaffected (idempotent).

## Risks / Trade-offs

- **Large CSV files slow preview**: Preview parses and queries the DB for each row (to detect new vs update). For very large files (thousands of rows) this could be slow. → Mitigation: add a server-side cap of 5 000 rows for preview; rows beyond the cap are reported as a warning in the preview response.
- **File sent twice**: The file is uploaded once for preview and once for confirm, doubling the upload payload. → Acceptable for the expected file sizes (< 1 MB); no mitigation needed.
- **Mapping state lives only in the browser**: If the user refreshes between steps, all progress is lost. → Acceptable UX trade-off; the wizard is short-lived.

## Migration Plan

1. Deploy new backend endpoints alongside the existing `/import-csv` endpoint.
2. Migrate the frontend `CsvUploadModal` to the new `CsvImportWizard`.
3. The old `/import-csv` endpoint remains in the codebase but is no longer called by the frontend. It can be removed in a future cleanup.
