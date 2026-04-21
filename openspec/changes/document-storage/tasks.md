## 1. Backend — DTOs

- [ ] 1.1 Create `FolderDto` record (path, name, lastModified) built from a `java.nio.file.Path` + `BasicFileAttributes`
- [ ] 1.2 Create `DocumentFileDto` record (path, name, size, mimeType, lastModified) built from a `Path` + `BasicFileAttributes` + `Files.probeContentType()`
- [ ] 1.3 Create `FolderContentsDto` record (list of FolderDto + list of DocumentFileDto)
- [ ] 1.4 Create request record types: `CreateFolderRequest`, `RenameFolderRequest`, `MoveFolderRequest`, `RenameFileRequest`, `MoveFileRequest`, `BulkPathsRequest`, `BulkMoveRequest`

## 2. Backend — Service

- [ ] 2.1 Create `DocumentService` (no `@Transactional`; no JPA) with storage root `Path` injected via `@Value("${assoincloud.documents.root:./data/documents}")`
- [ ] 2.2 Add `@PostConstruct` to create the storage root directory if it does not exist
- [ ] 2.3 Add private `resolveSafe(String relativePath)` helper that resolves and validates the path stays within the storage root (path-traversal guard — returns HTTP 400 if violated)
- [ ] 2.4 Implement folder methods: `listContents(path)`, `createFolder(path, name)`, `renameFolder(path, name)`, `moveFolder(path, targetPath)` (with circular-move guard via `startsWith`), `deleteFolder(path)` (recursive via `Files.walkFileTree()`)
- [ ] 2.5 Implement file methods: `uploadFiles(path, files)`, `downloadFile(path)`, `downloadFolderAsZip(path)`, `renameFile(path, name)`, `moveFile(path, targetPath)`, `deleteFile(path)`
- [ ] 2.6 Implement bulk methods: `bulkDeleteFiles(paths)`, `bulkMoveFiles(paths, targetPath)` (partial-success), `bulkDownloadFiles(paths)` (flat ZIP)
- [ ] 2.7 Add SLF4J logging (info for mutations, warn for conflicts/not-found, error for exceptions)

## 3. Backend — Controller

- [ ] 3.1 Create `DocumentController` mapped to `/api/documents` with constructor injection of `DocumentService`
- [ ] 3.2 Implement folder endpoints: `GET /browse?path=`, `POST /folders`, `PUT /folders`, `PUT /folders/move`, `DELETE /folders?path=`, `GET /folders/download?path=`
- [ ] 3.3 Implement file endpoints: `POST /files?path=`, `GET /files/download?path=`, `PUT /files`, `PUT /files/move`, `DELETE /files?path=`
- [ ] 3.4 Implement bulk endpoints: `POST /files/bulk-delete`, `POST /files/bulk-move`, `POST /files/bulk-download`

## 4. Backend — Tests

- [ ] 4.1 Write `DocumentServiceTest` using `@TempDir` (plain unit or `@SpringBootTest` with temp dir) covering: create/rename/move/delete folder (including circular-move and path-traversal rejection, duplicate-name rejection)
- [ ] 4.2 Add tests covering: upload file, download file, rename file, move file, delete file
- [ ] 4.3 Add tests for folder ZIP download (verify ZIP entry names and structure)
- [ ] 4.4 Add tests for bulk operations: bulk delete (partial unknown paths), bulk move (name conflict partial-success), bulk download ZIP
- [ ] 4.5 Run `./mvnw verify` and confirm all tests pass and coverage ≥ 70 %

## 5. Backend — Configuration & Docs

- [ ] 5.1 Add `assoincloud.documents.root` property to `application.yaml` with default `./data/documents`
- [ ] 5.2 Add `ASSOINCLOUD_DOCUMENTS_ROOT` env var to `docker-compose.yml` and `docker-compose.dev.yml`
- [ ] 5.3 Update `DEV.md` env var table with `ASSOINCLOUD_DOCUMENTS_ROOT`
- [ ] 5.4 Update `README.md` env var table with `ASSOINCLOUD_DOCUMENTS_ROOT`

## 6. Frontend — Types & API Client

- [ ] 6.1 Create `Folder` (path, name, lastModified) and `DocumentFile` (path, name, size, mimeType, lastModified) TypeScript interfaces in `src/types/`
- [ ] 6.2 Create `src/lib/api/documents.ts` with functions: `listContents`, `createFolder`, `renameFolder`, `moveFolder`, `deleteFolder`, `downloadFolderZip`, `uploadFiles`, `downloadFile`, `renameFile`, `moveFile`, `deleteFile`, `bulkDeleteFiles`, `bulkMoveFiles`, `bulkDownloadFiles`; add `logger` calls for each; use `path` query params matching the API shape

## 7. Frontend — UI Components

- [ ] 7.1 Create `src/components/documents/documents-page.tsx` — top-level page with two-panel layout; holds current path state (string)
- [ ] 7.2 Create `src/components/documents/folder-tree.tsx` — recursive folder tree using Mantine `NavLink`
- [ ] 7.3 Create `src/components/documents/folder-contents.tsx` — grid/list of sub-folders and files; each item has a right-click context menu (Mantine `Menu`) and a kebab-icon on hover; per-file checkboxes, "select all" header checkbox, selection state passed to bulk toolbar
- [ ] 7.4 Create `src/components/documents/breadcrumb-nav.tsx` — clickable breadcrumb using Mantine `Breadcrumbs`; splits current path string by `/`
- [ ] 7.5 Create `src/components/documents/create-folder-modal.tsx` — modal with name input and validation
- [ ] 7.6 Create `src/components/documents/rename-modal.tsx` — modal pre-filled with current name
- [ ] 7.7 Create `src/components/documents/move-modal.tsx` — folder picker dialog reused by single-item and bulk move
- [ ] 7.8 Create `src/components/documents/upload-zone.tsx` — drag-and-drop file upload with progress indicator; integrated into `folder-contents.tsx`
- [ ] 7.9 Create `src/components/documents/bulk-action-toolbar.tsx` — visible when ≥1 file selected; shows "N file selezionati" + Sposta / Elimina / Scarica come ZIP; hidden when empty
- [ ] 7.10 Ensure right-click context menu on a selected file augments with bulk actions (Sposta selezionati, Elimina selezionati, Scarica selezionati come ZIP)

## 8. Frontend — Navigation Integration

- [ ] 8.1 Add `"documents"` to the `Page` union type in `app-layout.tsx`
- [ ] 8.2 Add `{ label: "Documenti", value: "documents", icon: IconFolder }` (or similar Tabler icon) to the `navItems` array
- [ ] 8.3 Import `DocumentsPage` and render it conditionally inside `<AppShell.Main>`

## 9. Frontend — Tests & Build

- [ ] 9.1 Write Vitest tests for `documents.ts` API client (mock fetch; verify correct URLs and query params, including bulk endpoints)
- [ ] 9.2 Write Vitest component tests for `breadcrumb-nav.tsx`, `create-folder-modal.tsx`, and `bulk-action-toolbar.tsx`
- [ ] 9.3 Run `npm run coverage` and confirm all tests pass and coverage ≥ 70 %
- [ ] 9.4 Run `npm run build` and confirm the frontend compiles without errors

## 10. Documentation Update

- [ ] 10.1 Update `AGENTS.md` §1 feature table (add Documents row), §2.3 terminology (Document → Documento), §5.3 API list (add `/api/documents`)

