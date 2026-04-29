# Spec: folder-management

## Purpose
Defines folder storage API behavior for creating, listing, renaming, moving, and deleting document folders.

## Requirements

### Requirement: Create folder
The system SHALL allow users to create a new folder inside any existing folder (including the root) by creating an OS directory under the storage root. A folder name MUST be non-empty and unique within its parent (enforced by the file system). The root level is represented by an empty path string.

#### Scenario: Create folder at root
- **WHEN** the user sends `POST /api/documents/folders` with `{ "path": "", "name": "Verbali" }`
- **THEN** the system creates the directory `<root>/Verbali` and returns HTTP 201 with `FolderDto` (path, name, lastModified)

#### Scenario: Create nested folder
- **WHEN** the user sends `POST /api/documents/folders` with `{ "path": "Verbali", "name": "2024" }`
- **THEN** the system creates `<root>/Verbali/2024` and returns HTTP 201

#### Scenario: Duplicate name rejected
- **WHEN** a directory with the same name already exists in the target path
- **THEN** the system returns HTTP 409 with an Italian error message

#### Scenario: Empty name rejected
- **WHEN** the user sends a folder name that is blank or empty
- **THEN** the system returns HTTP 400 with an Italian error message

### Requirement: List folder contents
The system SHALL return the direct children (sub-folders and files) of a given path by reading the directory entries via the file system, ordered alphabetically (folders first, then files). Metadata (size, last-modified, MIME type) is read from `BasicFileAttributes` and `Files.probeContentType()`.

#### Scenario: List root contents
- **WHEN** the user sends `GET /api/documents/browse?path=`
- **THEN** the system returns HTTP 200 with `{ "folders": [...], "files": [...] }`

#### Scenario: List sub-folder contents
- **WHEN** the user sends `GET /api/documents/browse?path=Verbali/2024`
- **THEN** the system returns the direct children of that directory

#### Scenario: Non-existent path
- **WHEN** the path does not correspond to an existing directory on disk
- **THEN** the system returns HTTP 404 with an Italian error message

### Requirement: Rename folder
The system SHALL allow users to rename an existing folder using `Files.move()` within the same parent directory. The new name MUST be unique within the same parent.

#### Scenario: Successful rename
- **WHEN** the user sends `PUT /api/documents/folders` with `{ "path": "Verbali", "name": "Verbali Assemblee" }`
- **THEN** the system renames the directory and returns HTTP 200 with the updated `FolderDto`

#### Scenario: Rename to existing name
- **WHEN** the new name conflicts with a sibling directory
- **THEN** the system returns HTTP 409 with an Italian error message

### Requirement: Move folder
The system SHALL allow users to move a folder to a different parent using `Files.move()`. Moving a folder to one of its own descendants MUST be rejected.

#### Scenario: Successful move
- **WHEN** the user sends `PUT /api/documents/folders/move` with `{ "path": "Verbali/2024", "targetPath": "Archivio" }`
- **THEN** the system moves the directory to `<root>/Archivio/2024` and returns HTTP 200

#### Scenario: Circular move rejected
- **WHEN** the target path is inside the folder being moved
- **THEN** the system returns HTTP 400 with an Italian error message

### Requirement: Delete folder
The system SHALL allow users to delete a folder and ALL of its contents recursively using `Files.walkFileTree()`. This operation is irreversible.

#### Scenario: Delete empty folder
- **WHEN** the user sends `DELETE /api/documents/folders?path=Verbali/2024` on an empty directory
- **THEN** the system deletes the directory and returns HTTP 204

#### Scenario: Delete folder with contents
- **WHEN** the directory contains sub-directories and files
- **THEN** the system walks and deletes all entries recursively and returns HTTP 204

#### Scenario: Delete non-existent folder
- **WHEN** the path does not exist on disk
- **THEN** the system returns HTTP 404 with an Italian error message

