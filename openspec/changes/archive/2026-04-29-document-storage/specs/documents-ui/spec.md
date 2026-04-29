## ADDED Requirements

### Requirement: Documents page layout
The system SHALL provide a "Documenti" page with a two-panel layout: a collapsible folder tree on the left and a content panel on the right showing the currently selected folder's direct children (sub-folders and files).

#### Scenario: Initial page load
- **WHEN** the user navigates to the Documents page
- **THEN** the root-level folders are loaded and displayed in the left panel; the right panel shows root-level folders and files

#### Scenario: Folder selected in tree
- **WHEN** the user clicks a folder in the left tree or the right panel
- **THEN** the right panel updates to show the direct children of that folder and the breadcrumb updates

### Requirement: Right-click context menu on items
Every file and folder in the content panel SHALL expose a context menu triggered by right-clicking (or a kebab-menu icon on hover). The context menu SHALL be the primary way to access single-item actions. All actions that are also available in the bulk-action toolbar SHALL be accessible from this menu as well, so users never need to switch between mouse and toolbar for any operation.

For a **file**, the context menu SHALL contain: Scarica, Rinomina, Sposta, Elimina.
For a **folder**, the context menu SHALL contain: Apri, Scarica come ZIP, Rinomina, Sposta, Elimina.
When one or more files are **selected** and the user right-clicks one of the selected files, the context menu SHALL additionally show the bulk actions: Sposta selezionati, Elimina selezionati, Scarica selezionati come ZIP.

#### Scenario: Right-click on file shows file actions
- **WHEN** the user right-clicks a file item (or clicks its kebab-menu icon)
- **THEN** a context menu appears with: Scarica, Rinomina, Sposta, Elimina

#### Scenario: Right-click on folder shows folder actions
- **WHEN** the user right-clicks a folder item (or clicks its kebab-menu icon)
- **THEN** a context menu appears with: Apri, Scarica come ZIP, Rinomina, Sposta, Elimina

#### Scenario: Right-click on selected file shows bulk actions
- **WHEN** at least one file is selected and the user right-clicks one of the selected files
- **THEN** the context menu shows the standard file actions PLUS: Sposta selezionati, Elimina selezionati, Scarica selezionati come ZIP

#### Scenario: Context menu dismissed on outside click
- **WHEN** the user clicks anywhere outside the context menu
- **THEN** the menu closes without performing any action

### Requirement: Breadcrumb navigation
The system SHALL display a breadcrumb bar above the content panel showing the full path from root to the current folder. Each breadcrumb segment SHALL be clickable.

#### Scenario: Breadcrumb updates on navigation
- **WHEN** the user navigates into a sub-folder
- **THEN** the breadcrumb appends the folder name as a new clickable segment

#### Scenario: Navigate via breadcrumb
- **WHEN** the user clicks an ancestor segment in the breadcrumb
- **THEN** the content panel navigates back to that ancestor folder

### Requirement: Create folder via UI
The system SHALL provide a button or context-menu action to create a new folder inside the current folder. The user SHALL be prompted for a name via a modal dialog.

#### Scenario: Create folder success
- **WHEN** the user enters a valid name and confirms
- **THEN** the new folder appears in the content panel without a full page reload

#### Scenario: Create folder validation error
- **WHEN** the name is empty or already exists
- **THEN** an Italian error notification is displayed and the dialog remains open

### Requirement: Rename item via UI
The system SHALL allow renaming folders and files via the right-click context menu or the item's kebab-menu icon. Selecting "Rinomina" opens a modal input pre-filled with the current name.

#### Scenario: Rename success
- **WHEN** the user submits a valid new name
- **THEN** the item name updates in place in the UI

#### Scenario: Rename conflict
- **WHEN** the new name conflicts with a sibling
- **THEN** an Italian error notification is displayed

### Requirement: Move item via UI
The system SHALL allow moving folders and files to a different folder via the "Sposta" action in the right-click context menu. A folder picker dialog SHALL be presented.

#### Scenario: Move success
- **WHEN** the user selects a target folder and confirms
- **THEN** the item disappears from the current view and appears in the target folder

### Requirement: Delete item via UI
The system SHALL allow deleting folders and files via the "Elimina" action in the right-click context menu. A confirmation dialog MUST be shown before deletion. Folder deletion SHALL warn the user that all contents will be removed.

#### Scenario: Delete file confirmed
- **WHEN** the user confirms the delete dialog for a file
- **THEN** the file is removed from the UI without a full page reload

#### Scenario: Delete folder confirmed
- **WHEN** the user confirms the delete dialog for a folder (with warning about recursive deletion)
- **THEN** the folder and all its contents are removed

#### Scenario: Delete cancelled
- **WHEN** the user dismisses the confirmation dialog
- **THEN** nothing is deleted

### Requirement: Upload files via UI
The system SHALL provide a file upload button and SHALL support drag-and-drop onto the content panel. Multiple files MAY be selected at once. A progress indicator SHALL be shown during upload.

#### Scenario: Upload via button
- **WHEN** the user clicks "Carica file" and selects one or more files
- **THEN** the files are uploaded to the current folder and appear in the content panel on completion

#### Scenario: Upload via drag-and-drop
- **WHEN** the user drags files onto the content panel
- **THEN** the panel highlights as a drop target and files are uploaded on drop

#### Scenario: Upload error
- **WHEN** an upload fails (e.g., duplicate name or server error)
- **THEN** an Italian error notification is displayed for the failing file; other files in the batch are unaffected

### Requirement: Download file via UI
The system SHALL allow downloading a file via the "Scarica" action in the right-click context menu or a download icon on hover.

#### Scenario: Download triggered
- **WHEN** the user clicks the download action for a file
- **THEN** the browser initiates a file download with the correct filename

### Requirement: Multi-file selection
The system SHALL allow users to select multiple files via checkboxes in the content panel. A "select all" checkbox in the toolbar header SHALL select or deselect all files in the current folder. Folders MUST NOT be selectable for bulk operations.

#### Scenario: Select individual files
- **WHEN** the user clicks the checkbox on one or more file items
- **THEN** the checked files are added to the selection set and the bulk action toolbar appears

#### Scenario: Select all files
- **WHEN** the user clicks the "select all" checkbox in the header
- **THEN** all files in the current folder are selected

#### Scenario: Deselect all
- **WHEN** the user clicks the "select all" checkbox while all files are selected, or navigates to a different folder
- **THEN** the selection is cleared and the bulk action toolbar is hidden

### Requirement: Bulk action toolbar
The system SHALL display a persistent toolbar at the top of the content panel when one or more files are selected. The toolbar SHALL show the count of selected files and provide three actions: "Sposta", "Elimina", "Scarica come ZIP".

#### Scenario: Toolbar appears on selection
- **WHEN** at least one file is selected
- **THEN** the toolbar appears showing "N file selezionati" and the three action buttons

#### Scenario: Toolbar hidden when nothing selected
- **WHEN** no files are selected
- **THEN** the toolbar is not visible (or collapsed)

### Requirement: Bulk move via UI
The system SHALL allow moving all selected files to a target folder via the "Sposta" button in the bulk action toolbar. The same folder picker dialog used for single-item move SHALL be reused.

#### Scenario: Bulk move success
- **WHEN** the user selects files, clicks "Sposta", picks a target folder and confirms
- **THEN** all selected files are moved, the selection is cleared, and the content panel refreshes

#### Scenario: Bulk move partial failure
- **WHEN** some files conflict with names in the target folder
- **THEN** an Italian notification lists the files that could not be moved; the rest are moved successfully

### Requirement: Bulk delete via UI
The system SHALL allow deleting all selected files via the "Elimina" button in the bulk action toolbar. A single confirmation dialog MUST be shown listing the count of files to be deleted.

#### Scenario: Bulk delete confirmed
- **WHEN** the user confirms the bulk delete dialog
- **THEN** all selected files are deleted, the selection is cleared, and the content panel refreshes

#### Scenario: Bulk delete cancelled
- **WHEN** the user dismisses the confirmation dialog
- **THEN** nothing is deleted and the selection is preserved

### Requirement: Bulk download via UI
The system SHALL allow downloading all selected files as a ZIP archive via the "Scarica come ZIP" button in the bulk action toolbar.

#### Scenario: Bulk download triggered
- **WHEN** the user clicks "Scarica come ZIP" in the bulk action toolbar
- **THEN** the browser downloads a ZIP archive named "download.zip" containing all selected files

### Requirement: Download folder as ZIP via UI
The system SHALL allow downloading an entire folder (with all its contents) as a ZIP archive via a context-menu "Scarica come ZIP" action.

#### Scenario: ZIP download triggered
- **WHEN** the user selects "Scarica come ZIP" from a folder's context menu
- **THEN** the browser downloads a ZIP archive named after the folder
