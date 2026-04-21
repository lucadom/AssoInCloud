"use client";

import { useRef, useState } from "react";
import {
  SimpleGrid,
  Card,
  Text,
  Group,
  ActionIcon,
  Menu,
  Checkbox,
  ThemeIcon,
  Stack,
  Loader,
  Center,
  Button,
  Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconFolder,
  IconFile,
  IconDotsVertical,
  IconDownload,
  IconPencil,
  IconArrowsMove,
  IconTrash,
  IconFileZip,
  IconFolderOpen,
} from "@tabler/icons-react";
import type { Folder, DocumentFile } from "@/types";
import {
  deleteFolder,
  deleteFile,
  downloadFile,
  downloadFolderZip,
  bulkDeleteFiles,
  bulkDownloadFiles,
} from "@/lib/api/documents";
import { RenameModal } from "./rename-modal";
import { MoveModal } from "./move-modal";
import { BulkActionToolbar } from "./bulk-action-toolbar";
import { UploadZone } from "./upload-zone";

interface FolderContentsProps {
  path: string;
  folders: Folder[];
  files: DocumentFile[];
  loading: boolean;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
  onCreateFolder: () => void;
  onUploadFiles: (inputRef: React.RefObject<HTMLInputElement | null>) => void;
}

export function FolderContents({
  path,
  folders,
  files,
  loading,
  onNavigate,
  onRefresh,
  onCreateFolder,
  onUploadFiles,
}: FolderContentsProps) {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [renameTarget, setRenameTarget] = useState<{ path: string; name: string; type: "file" | "folder" } | null>(null);
  const [moveTarget, setMoveTarget] = useState<{ paths: string[]; bulk: boolean } | null>(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ paths: string[]; bulk: boolean; isFolder: boolean } | null>(null);
  const [renameOpened, { open: openRename, close: closeRename }] = useDisclosure(false);
  const [moveOpened, { open: openMove, close: closeMove }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const allFilePaths = files.map((f) => f.path);
  const allSelected = allFilePaths.length > 0 && allFilePaths.every((p) => selectedPaths.has(p));

  const toggleSelect = (filePath: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) next.delete(filePath);
      else next.add(filePath);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(allFilePaths));
    }
  };

  const handleRename = (item: { path: string; name: string }, type: "file" | "folder") => {
    setRenameTarget({ path: item.path, name: item.name, type });
    openRename();
  };

  const handleMove = (itemPaths: string[], bulk = false) => {
    setMoveTarget({ paths: itemPaths, bulk });
    openMove();
  };

  const handleDeleteConfirm = (itemPaths: string[], bulk: boolean, isFolder: boolean) => {
    setDeleteConfirmTarget({ paths: itemPaths, bulk, isFolder });
    openDelete();
  };

  const handleRenameConfirm = async (newName: string) => {
    if (!renameTarget) return;
    const { renameFolder, renameFile } = await import("@/lib/api/documents");
    if (renameTarget.type === "folder") {
      await renameFolder(renameTarget.path, newName);
    } else {
      await renameFile(renameTarget.path, newName);
    }
    onRefresh();
  };

  const handleMoveConfirm = async (targetPath: string) => {
    if (!moveTarget) return;
    const { moveFolder, moveFile, bulkMoveFiles } = await import("@/lib/api/documents");
    if (moveTarget.bulk) {
      const result = await bulkMoveFiles(moveTarget.paths, targetPath);
      if (result.failed.length > 0) {
        notifications.show({
          title: "Spostamento parziale",
          message: `${result.moved} spostati, ${result.failed.length} non spostati`,
          color: "yellow",
        });
      }
      setSelectedPaths(new Set());
    } else {
      const isFolderPath = folders.some((f) => f.path === moveTarget.paths[0]);
      if (isFolderPath) {
        await moveFolder(moveTarget.paths[0], targetPath);
      } else {
        await moveFile(moveTarget.paths[0], targetPath);
      }
    }
    onRefresh();
  };

  const handleDeleteExecute = async () => {
    if (!deleteConfirmTarget) return;
    try {
      if (deleteConfirmTarget.bulk) {
        await bulkDeleteFiles(deleteConfirmTarget.paths);
        setSelectedPaths(new Set());
      } else if (deleteConfirmTarget.isFolder) {
        await deleteFolder(deleteConfirmTarget.paths[0]);
      } else {
        await deleteFile(deleteConfirmTarget.paths[0]);
      }
      onRefresh();
    } catch (e: unknown) {
      notifications.show({
        title: "Errore",
        message: e instanceof Error ? e.message : "Errore nell'eliminazione",
        color: "red",
      });
    } finally {
      closeDelete();
    }
  };

  const handleBulkDownload = async () => {
    try {
      await bulkDownloadFiles(Array.from(selectedPaths));
    } catch (e: unknown) {
      notifications.show({
        title: "Errore",
        message: e instanceof Error ? e.message : "Errore nel download",
        color: "red",
      });
    }
  };

  if (loading) {
    return <Center h={200}><Loader /></Center>;
  }

  const selectedCount = selectedPaths.size;

  return (
    <Stack gap="sm">
      <BulkActionToolbar
        selectedCount={selectedCount}
        onMove={() => handleMove(Array.from(selectedPaths), true)}
        onDelete={() => handleDeleteConfirm(Array.from(selectedPaths), true, false)}
        onDownload={handleBulkDownload}
      />

      <Group justify="space-between">
        <Group gap="xs">
          {files.length > 0 && (
            <Checkbox
              checked={allSelected}
              indeterminate={selectedCount > 0 && !allSelected}
              onChange={toggleSelectAll}
              label="Seleziona tutti"
              size="xs"
            />
          )}
        </Group>
        <Group gap="xs">
          <Button size="xs" variant="light" onClick={onCreateFolder}>
            Nuova cartella
          </Button>
          <Button size="xs" variant="light" onClick={() => fileInputRef.current?.click()}>
            Carica file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              const fileList = Array.from(e.target.files ?? []);
              if (fileList.length > 0) {
                import("@/lib/api/documents").then(({ uploadFiles }) =>
                  uploadFiles(path, fileList)
                    .then(() => { onRefresh(); e.target.value = ""; })
                    .catch((err: unknown) =>
                      notifications.show({
                        title: "Errore",
                        message: err instanceof Error ? err.message : "Errore upload",
                        color: "red",
                      })
                    )
                );
              }
            }}
          />
        </Group>
      </Group>

      <UploadZone currentPath={path} onUploadComplete={() => onRefresh()}>
        {folders.length === 0 && files.length === 0 ? (
          <Center h={120}>
            <Text c="dimmed" size="sm">Cartella vuota. Trascina file qui o usa &quot;Carica file&quot;.</Text>
          </Center>
        ) : (
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
            {folders.map((folder) => (
              <Menu key={folder.path} shadow="md" width={200} withArrow>
                <Menu.Target>
                  <Card
                    withBorder
                    padding="sm"
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onDoubleClick={() => onNavigate(folder.path)}
                  >
                    <Stack gap={4} align="center">
                      <ThemeIcon variant="light" size="xl">
                        <IconFolder size={24} />
                      </ThemeIcon>
                      <Text size="xs" ta="center" lineClamp={2}>
                        {folder.name}
                      </Text>
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconDotsVertical size={12} />
                      </ActionIcon>
                    </Stack>
                  </Card>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconFolderOpen size={14} />} onClick={() => onNavigate(folder.path)}>
                    Apri
                  </Menu.Item>
                  <Menu.Item leftSection={<IconFileZip size={14} />} onClick={() => downloadFolderZip(folder.path)}>
                    Scarica come ZIP
                  </Menu.Item>
                  <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => handleRename(folder, "folder")}>
                    Rinomina
                  </Menu.Item>
                  <Menu.Item leftSection={<IconArrowsMove size={14} />} onClick={() => handleMove([folder.path])}>
                    Sposta
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDeleteConfirm([folder.path], false, true)}>
                    Elimina
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ))}

            {files.map((file) => {
              const isSelected = selectedPaths.has(file.path);
              const hasSelection = selectedCount > 0;
              return (
                <Menu key={file.path} shadow="md" width={220} withArrow>
                  <Menu.Target>
                    <Card
                      withBorder
                      padding="sm"
                      style={{
                        cursor: "pointer",
                        userSelect: "none",
                        outline: isSelected ? "2px solid var(--mantine-color-blue-5)" : undefined,
                      }}
                    >
                      <Stack gap={4} align="center">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleSelect(file.path)}
                          onClick={(e) => e.stopPropagation()}
                          size="xs"
                          style={{ alignSelf: "flex-start" }}
                        />
                        <ThemeIcon variant="light" size="xl" color="gray">
                          <IconFile size={24} />
                        </ThemeIcon>
                        <Text size="xs" ta="center" lineClamp={2}>
                          {file.name}
                        </Text>
                        <ActionIcon size="xs" variant="subtle">
                          <IconDotsVertical size={12} />
                        </ActionIcon>
                      </Stack>
                    </Card>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item leftSection={<IconDownload size={14} />} onClick={() => downloadFile(file.path, file.name)}>
                      Scarica
                    </Menu.Item>
                    <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => handleRename(file, "file")}>
                      Rinomina
                    </Menu.Item>
                    <Menu.Item leftSection={<IconArrowsMove size={14} />} onClick={() => handleMove([file.path])}>
                      Sposta
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDeleteConfirm([file.path], false, false)}>
                      Elimina
                    </Menu.Item>
                    {hasSelection && isSelected && (
                      <>
                        <Menu.Divider />
                        <Menu.Label>Selezione ({selectedCount})</Menu.Label>
                        <Menu.Item leftSection={<IconArrowsMove size={14} />} onClick={() => handleMove(Array.from(selectedPaths), true)}>
                          Sposta selezionati
                        </Menu.Item>
                        <Menu.Item leftSection={<IconFileZip size={14} />} onClick={handleBulkDownload}>
                          Scarica selezionati come ZIP
                        </Menu.Item>
                        <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => handleDeleteConfirm(Array.from(selectedPaths), true, false)}>
                          Elimina selezionati
                        </Menu.Item>
                      </>
                    )}
                  </Menu.Dropdown>
                </Menu>
              );
            })}
          </SimpleGrid>
        )}
      </UploadZone>

      <RenameModal
        opened={renameOpened}
        currentName={renameTarget?.name ?? ""}
        itemType={renameTarget?.type ?? "file"}
        onClose={closeRename}
        onConfirm={handleRenameConfirm}
      />

      <MoveModal
        opened={moveOpened}
        title={moveTarget?.bulk ? `Sposta ${moveTarget.paths.length} file` : "Sposta elemento"}
        onClose={closeMove}
        onConfirm={handleMoveConfirm}
      />

      <Modal
        opened={deleteOpened}
        onClose={closeDelete}
        title="Conferma eliminazione"
      >
        <Stack>
          <Text size="sm">
            {deleteConfirmTarget?.bulk
              ? `Eliminare ${deleteConfirmTarget.paths.length} file selezionati? L'operazione è irreversibile.`
              : deleteConfirmTarget?.isFolder
              ? "Eliminare questa cartella e tutto il suo contenuto? L'operazione è irreversibile."
              : "Eliminare questo file? L'operazione è irreversibile."}
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeDelete}>Annulla</Button>
            <Button color="red" onClick={handleDeleteExecute}>Elimina</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
