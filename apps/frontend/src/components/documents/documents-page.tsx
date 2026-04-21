"use client";

import { useCallback, useEffect, useState } from "react";
import { Group, Paper, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import type { FolderContents } from "@/types";
import { listContents, createFolder } from "@/lib/api/documents";
import { BreadcrumbNav } from "./breadcrumb-nav";
import { FolderTree } from "./folder-tree";
import { FolderContents as FolderContentsPanel } from "./folder-contents";
import { CreateFolderModal } from "./create-folder-modal";

export function DocumentsPage() {
  const [currentPath, setCurrentPath] = useState("");
  const [contents, setContents] = useState<FolderContents>({ folders: [], files: [] });
  const [loading, setLoading] = useState(false);
  const [createFolderOpened, { open: openCreateFolder, close: closeCreateFolder }] = useDisclosure(false);

  const loadContents = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const data = await listContents(path);
      setContents(data);
    } catch (e: unknown) {
      notifications.show({
        title: "Errore",
        message: e instanceof Error ? e.message : "Errore nel caricamento",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContents(currentPath);
  }, [currentPath, loadContents]);

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleCreateFolder = async (name: string) => {
    await createFolder(currentPath, name);
    await loadContents(currentPath);
  };

  return (
    <Stack gap="md" p="md">
      <Text fw={700} size="xl">Documenti</Text>
      <Group align="flex-start" gap="md" style={{ minHeight: "calc(100vh - 160px)" }}>
        <Paper withBorder p="sm" style={{ width: 220, minHeight: 400, flexShrink: 0 }}>
          <FolderTree currentPath={currentPath} onNavigate={handleNavigate} />
        </Paper>
        <Stack flex={1} gap="sm">
          <BreadcrumbNav path={currentPath} onNavigate={handleNavigate} />
          <FolderContentsPanel
            path={currentPath}
            folders={contents.folders}
            files={contents.files}
            loading={loading}
            onNavigate={handleNavigate}
            onRefresh={() => loadContents(currentPath)}
            onCreateFolder={openCreateFolder}
            onUploadFiles={() => {}}
          />
        </Stack>
      </Group>

      <CreateFolderModal
        opened={createFolderOpened}
        onClose={closeCreateFolder}
        onConfirm={handleCreateFolder}
      />
    </Stack>
  );
}
