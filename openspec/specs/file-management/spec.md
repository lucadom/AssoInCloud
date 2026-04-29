# Spec: file-management

## Purpose
Defines file storage API behavior for uploading, downloading, renaming, moving, deleting, and bulk operations on document files.

## Requirements

### Requirement: Upload file
The system SHALL allow users to upload one or more files into a specified folder path using a `multipart/form-data` request. Files are stored with their original filename under the target directory. The filename MUST be unique within the target directory (enforced by the file system check before write).

#### Scenario: Single file upload
- **WHEN** the user sends `POST /api/documents/files?path=Verbali/2024` with a single file part
- **THEN** the system writes the file to `<root>/Verbali/2024/<filename>` and returns HTTP 201 with `DocumentFileDto` (path, name, size, mimeType, lastModified)

#### Scenario: Multiple files upload
- **WHEN** the user sends multiple file parts in a single multipart request
- **THEN** the system writes all files and returns HTTP 201 with a list of `DocumentFileDto`

#### Scenario: Duplicate filename rejected
- **WHEN** a file with the same name already exists in the target directory
- **THEN** the system returns HTTP 409 with an Italian error message

#### Scenario: Invalid or missing folder
- **WHEN** the `path` does not correspond to an existing directory
- **THEN** the system returns HTTP 400 with an Italian error message

### Requirement: Download file
The system SHALL allow users to download a file by its relative path. The response MUST stream the binary content with the correct `Content-Type` (from `Files.probeContentType()`) and `Content-Disposition` headers.

#### Scenario: Successful download
- **WHEN** the user sends `GET /api/documents/files/download?path=Verbali/2024/report.pdf`
- **THEN** the system streams the file with `Content-Disposition: attachment; filename="report.pdf"` and the detected MIME type

#### Scenario: File not found
- **WHEN** the path does not correspond to an existing file
- **THEN** the system returns HTTP 404 with an Italian error message

### Requirement: Download folder as ZIP
The system SHALL allow users to download all contents of a folder (recursively) as a ZIP archive streamed directly in the response, preserving the internal directory structure.

#### Scenario: Successful folder ZIP download
- **WHEN** the user sends `GET /api/documents/folders/download?path=Verbali/2024`
- **THEN** the system streams a ZIP with entries preserving the sub-path structure, `Content-Disposition: attachment; filename="2024.zip"`

#### Scenario: Empty folder ZIP download
- **WHEN** the directory has no contents
- **THEN** the system streams an empty valid ZIP and returns HTTP 200

### Requirement: Rename file
The system SHALL allow users to rename an existing file using `Files.move()` within the same directory. The new name MUST be unique within the same directory.

#### Scenario: Successful rename
- **WHEN** the user sends `PUT /api/documents/files` with `{ "path": "Verbali/2024/report.pdf", "name": "verbale-assemblea.pdf" }`
- **THEN** the system renames the file on disk and returns HTTP 200 with the updated `DocumentFileDto`

#### Scenario: Rename to existing name
- **WHEN** the new name conflicts with a sibling file
- **THEN** the system returns HTTP 409 with an Italian error message

### Requirement: Move file
The system SHALL allow users to move a file to a different directory using `Files.move()`.

#### Scenario: Successful move
- **WHEN** the user sends `PUT /api/documents/files/move` with `{ "path": "Verbali/2024/report.pdf", "targetPath": "Archivio/2024" }`
- **THEN** the system moves the file to `<root>/Archivio/2024/report.pdf` and returns HTTP 200

#### Scenario: Move to non-existent folder
- **WHEN** the target path does not correspond to an existing directory
- **THEN** the system returns HTTP 400 with an Italian error message

### Requirement: Delete file
The system SHALL allow users to delete a file using `Files.delete()`.

#### Scenario: Successful delete
- **WHEN** the user sends `DELETE /api/documents/files?path=Verbali/2024/report.pdf`
- **THEN** the system deletes the file from disk and returns HTTP 204

#### Scenario: Delete non-existent file
- **WHEN** the path does not correspond to an existing file
- **THEN** the system returns HTTP 404 with an Italian error message

### Requirement: Bulk delete files
The system SHALL allow users to delete multiple files in a single request. Files that do not exist SHALL be silently ignored.

#### Scenario: Bulk delete succeeds
- **WHEN** the user sends `POST /api/documents/files/bulk-delete` with `{ "paths": ["Verbali/a.pdf", "Verbali/b.pdf"] }`
- **THEN** the system deletes all existing files and returns HTTP 204

#### Scenario: Bulk delete with unknown paths
- **WHEN** some paths in the list do not exist
- **THEN** the system deletes the ones that do exist and returns HTTP 204

### Requirement: Bulk move files
The system SHALL allow users to move multiple files to a target directory. Conflicts MUST be reported per-file without aborting the whole batch.

#### Scenario: Bulk move succeeds
- **WHEN** the user sends `POST /api/documents/files/bulk-move` with `{ "paths": [...], "targetPath": "Archivio/2024" }`
- **THEN** the system moves all files and returns HTTP 200 with `{ "moved": N, "failed": [...] }`

#### Scenario: Bulk move with name conflict
- **WHEN** one or more files conflict with existing names in the target directory
- **THEN** conflicting files are skipped and included in `failed` with an Italian reason; the rest are moved

#### Scenario: Bulk move to non-existent folder
- **WHEN** the `targetPath` does not correspond to an existing directory
- **THEN** the system returns HTTP 400 with an Italian error message

### Requirement: Bulk download files as ZIP
The system SHALL allow users to download multiple selected files as a single streaming ZIP archive with a flat structure.

#### Scenario: Bulk download succeeds
- **WHEN** the user sends `POST /api/documents/files/bulk-download` with `{ "paths": ["Verbali/a.pdf", "Contratti/b.pdf"] }`
- **THEN** the system streams a flat ZIP containing only the requested files, `Content-Disposition: attachment; filename="download.zip"`

#### Scenario: Bulk download with unknown paths
- **WHEN** some paths do not exist
- **THEN** the system includes only the existing files in the ZIP and returns HTTP 200

