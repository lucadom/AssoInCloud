## Why

AssoInCloud currently has no way to store and organize association documents (statutes, meeting minutes, contracts, receipts, etc.). A dedicated document storage page gives users a familiar, drive-like interface to manage files directly from the application, eliminating the need for external tools.

## What Changes

- Add a new "Documenti" page accessible from the main navigation.
- Introduce a backend file-system service that stores uploaded files and folder metadata in a dedicated directory and SQLite table.
- Users can create, rename, move, and delete folders.
- Users can upload files (individually or as a batch), download files, rename them, move them, and delete them.
- Users can select multiple files via checkboxes and perform bulk operations: move all selected to a folder, delete all selected, or download all selected as a ZIP archive.
- Folders can be downloaded as a ZIP archive.
- The UI mirrors a familiar explorer/drive layout: breadcrumb navigation, folder tree, file grid/list with a bulk-action toolbar that appears on selection.

## Capabilities

### New Capabilities

- `folder-management`: Create, rename, move, and delete folders in a hierarchical tree; folder metadata persisted in SQLite.
- `file-management`: Upload, download, rename, move, and delete files; binary content stored on disk under a configurable root path; bulk delete, bulk move, and bulk download (as ZIP) for multiple files at once.
- `documents-ui`: Frontend "Documenti" page with breadcrumb navigation, folder/file listing, context-menu actions, drag-and-drop upload, and multi-file selection with bulk action toolbar.

### Modified Capabilities

- `app-navigation`: Add "Documenti" entry to the main navigation bar.

## Impact

- **Backend**: no Flyway migration, no JPA entities, no repositories; a `DocumentService` that operates entirely via `java.nio.file`; a `DocumentController`; file storage rooted at a configurable path (`ASSOINCLOUD_DOCUMENTS_ROOT`).
- **Frontend**: new types (`Folder`, `DocumentFile`), new API client functions (`src/lib/api/documents.ts`), new page components under `src/components/documents/`.
- **Navigation**: `app-layout.tsx` updated with the new page entry.
- **Docker / env**: `ASSOINCLOUD_DOCUMENTS_ROOT` variable added to `docker-compose.yml`, `docker-compose.dev.yml`, `application.yaml`, `DEV.md`, `README.md`.
