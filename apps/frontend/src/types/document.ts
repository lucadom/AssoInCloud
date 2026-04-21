export interface Folder {
  path: string;
  name: string;
  lastModified: string;
}

export interface DocumentFile {
  path: string;
  name: string;
  size: number;
  mimeType: string;
  lastModified: string;
}

export interface FolderContents {
  folders: Folder[];
  files: DocumentFile[];
}

export interface BulkMoveResult {
  moved: number;
  failed: string[];
}
