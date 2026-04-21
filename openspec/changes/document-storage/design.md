## Context

AssoInCloud is a Spring Boot 4 / Next.js 16 application for Italian association management. Currently there is no document storage feature. The design must be as simple as possible: the file system IS the source of truth for both folder hierarchy and file metadata — no additional database tables are introduced.

## Goals / Non-Goals

**Goals:**
- Hierarchical folder management (create, rename, move, delete).
- File upload (multipart), download, rename, move, delete.
- ZIP download of an entire folder tree.
- A Google Drive–style frontend page with breadcrumb navigation and context-menu actions.
- Configurable storage root via `ASSOINCLOUD_DOCUMENTS_ROOT` env var.

**Non-Goals:**
- Versioning or file history.
- Fine-grained per-file permissions (all authenticated users have full access).
- Full-text search or preview rendering.
- Cloud storage backends (S3, GCS) — local disk only for now.
- Real-time collaboration or locking.
- Any SQLite table or Flyway migration for document/folder metadata.

## Decisions

### D1 — File system as the sole source of truth

**Decision**: Folder hierarchy = OS directories under `ASSOINCLOUD_DOCUMENTS_ROOT`. File metadata (name, size, MIME type, last-modified date) is read on-demand from `java.nio.file.BasicFileAttributes` and `Files.probeContentType()`. No `folders` or `documents` table; no JPA entities; no Flyway migration for this feature.

**Rationale**: Eliminates an entire persistence layer (migration, entity, repository) for data the OS already tracks natively. Moves, renames, and deletes map directly to `Files.move()` / `Files.delete()`. Backup is reduced to a single directory copy. Unique-name enforcement is provided by the OS.

**Alternatives considered**:
- Metadata in SQLite — rejected: adds DB schema, entities, and repositories for information the file system already provides for free.
- Content-addressed storage (UUID filenames) — rejected: breaks browsability and requires a DB to resolve display names.

### D2 — ZIP download via streaming on the fly

**Decision**: When the user downloads a folder or a bulk selection, the controller streams a ZIP archive built on-the-fly via `ZipOutputStream` without creating a temporary file.

**Rationale**: Avoids disk space waste for large folders and reduces latency (first byte arrives immediately).

### D3 — Storage root path from env var with safe default

**Decision**: `ASSOINCLOUD_DOCUMENTS_ROOT` defaults to `./data/documents` relative to the working directory. The service creates the root directory at startup (`@PostConstruct`) if it does not exist.

**Rationale**: Consistent with the existing `data/` convention; easy to override in Docker via volume mount.

### D4 — Path-based resource identifiers via query parameter

**Decision**: Items are identified by their **relative path** from the storage root (e.g., `contracts/2024/invoice.pdf`). The root folder is represented by an empty string. All endpoints receive the path as a `path` query parameter or in the request body, avoiding Spring MVC slash-in-path-variable issues.

API shape under `/api/documents`:
- `GET  /browse?path=`                         — list folder contents (folders + files)
- `POST /folders`  body `{ path, name }`       — create sub-folder
- `PUT  /folders`  body `{ path, name }`       — rename folder
- `PUT  /folders/move` body `{ path, targetPath }` — move folder
- `DELETE /folders?path=`                      — recursive delete
- `GET  /folders/download?path=`               — stream folder as ZIP
- `POST /files?path=` (multipart)              — upload one or more files
- `GET  /files/download?path=`                 — download single file
- `PUT  /files`  body `{ path, name }`         — rename file
- `PUT  /files/move` body `{ path, targetPath }` — move file
- `DELETE /files?path=`                        — delete file
- `POST /files/bulk-delete` body `{ paths }`
- `POST /files/bulk-move`   body `{ paths, targetPath }`
- `POST /files/bulk-download` body `{ paths }` — stream as `download.zip`

**Rationale**: Relative paths are human-readable, require no ID-to-path resolution, and map trivially to `Path.resolve()` calls on the server.

### D5 — Frontend: single-panel explorer with breadcrumb

**Decision**: The Documents page renders a two-panel layout. The left side shows a collapsible folder tree; the right side shows the contents of the currently selected folder. A breadcrumb at the top tracks the current path. The frontend passes the current relative path string as the identifier for all API calls.

**Rationale**: Mirrors familiar tools (Google Drive, Dropbox) without needing complex state beyond the current path string. Mantine's `NavLink` and `Breadcrumbs` components cover the layout without adding new libraries.

## Risks / Trade-offs

- [Risk] Path traversal attacks (e.g., `../../etc/passwd`) → Mitigation: service validates every resolved path starts with the storage root; returns HTTP 400 if not.
- [Risk] Very large folder ZIP downloads may time out → Mitigation: streaming response; frontend shows a spinner with no progress bar for now.
- [Risk] Storage root not backed up → Mitigation: document that `ASSOINCLOUD_DOCUMENTS_ROOT` volume must be included in backup strategy.
- [Risk] Name conflicts on bulk move → Mitigation: per-file conflict check before moving; partial-success response lists failed items.
- [Risk] OS-level filename restrictions vary by platform → Mitigation: document that Linux is the target runtime; Windows dev machines may have different limits.

## Migration Plan

1. Set `ASSOINCLOUD_DOCUMENTS_ROOT` env var (or rely on default `./data/documents`).
2. Deploy new backend — service creates the root directory automatically at startup.
3. No DB migration, no data migration required (feature is new).
4. Rollback: redeploy previous image; the documents directory remains on disk but is unused.

## Open Questions

- Should empty folders be shown differently (e.g., greyed out)? → Assume no special treatment for v1.
- Maximum file size limit? → Rely on Spring Boot's default (`spring.servlet.multipart.max-file-size`); document the override.
