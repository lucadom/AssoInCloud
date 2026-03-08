"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Alert,
  Box,
  Group,
  LoadingOverlay,
  Modal,
  ScrollArea,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue, useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconMailExclamation, IconSearch, IconX } from "@tabler/icons-react";
import type { PecFolder, PecMessage, PecMessageSummary } from "@/types";
import {
  fetchPecFolders,
  fetchPecMessage,
  fetchPecMessages,
  isPecNotConfiguredError,
  searchPecMessages,
  setPecReadStatus,
} from "@/lib/api/pec";
import { FolderList } from "./pec/folder-list";
import { MessageList } from "./pec/message-list";
import { MessageViewer } from "./pec/message-viewer";

export function PecInboxPage() {
  const isMobile = useMediaQuery("(max-width: 48em)");
  const [mobileView, setMobileView] = useState<"folders" | "messages">("folders");
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [folders, setFolders] = useState<PecFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [messages, setMessages] = useState<PecMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<PecMessage | null>(null);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [envelopeMode, setEnvelopeMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchQuery, 400);

  const PAGE_SIZE = 25;

  // Refs used to avoid stale closures in the search effect
  const wasSearchingRef = useRef(false);
  const selectedFolderRef = useRef<string | null>(selectedFolder);
  selectedFolderRef.current = selectedFolder;

  useEffect(() => {
    setLoadingFolders(true);
    fetchPecFolders()
      .then((data) => {
        setFolders(data);
        if (data.length > 0) {
          setSelectedFolder(data[0].fullName);
        }
      })
      .catch((err: unknown) => {
        if (isPecNotConfiguredError(err)) {
          setNotConfigured(true);
        } else {
          notifications.show({
            title: "Errore",
            message: err instanceof Error ? err.message : "Errore sconosciuto",
            color: "red",
          });
        }
      })
      .finally(() => setLoadingFolders(false));
  }, []);

  const loadMessages = useCallback((folderName: string) => {
    setLoadingMessages(true);
    setMessages([]);
    setSelectedMessage(null);
    setCurrentPage(0);
    setHasMore(false);
    fetchPecMessages(folderName, 0, PAGE_SIZE)
      .then((data) => {
        setMessages(data);
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch((err: unknown) =>
        notifications.show({
          title: "Errore",
          message: err instanceof Error ? err.message : "Errore sconosciuto",
          color: "red",
        })
      )
      .finally(() => setLoadingMessages(false));
  }, [PAGE_SIZE]);

  // Effect: load messages when folder changes
  useEffect(() => {
    if (selectedFolder) {
      wasSearchingRef.current = false;
      loadMessages(selectedFolder);
    }
  }, [selectedFolder, loadMessages]);

  // Effect: search when debounced query changes (uses ref for folder to avoid
  // re-running when only the folder changes)
  useEffect(() => {
    const folder = selectedFolderRef.current;
    if (!folder) return;
    const q = debouncedSearch.trim();
    if (q) {
      wasSearchingRef.current = true;
      setLoadingMessages(true);
      setMessages([]);
      setSelectedMessage(null);
      setHasMore(false);
      searchPecMessages(folder, q)
        .then(setMessages)
        .catch((err: unknown) =>
          notifications.show({
            title: "Errore",
            message: err instanceof Error ? err.message : "Errore sconosciuto",
            color: "red",
          })
        )
        .finally(() => setLoadingMessages(false));
    } else if (wasSearchingRef.current) {
      wasSearchingRef.current = false;
      loadMessages(folder);
    }
  // selectedFolder intentionally excluded — accessed via selectedFolderRef
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, loadMessages]);

  const handleLoadMore = useCallback(() => {
    if (!selectedFolder || loadingMore) return;
    const nextPage = currentPage + 1;
    setLoadingMore(true);
    fetchPecMessages(selectedFolder, nextPage, PAGE_SIZE)
      .then((data) => {
        setMessages((prev) => [...prev, ...data]);
        setCurrentPage(nextPage);
        setHasMore(data.length === PAGE_SIZE);
      })
      .catch((err: unknown) =>
        notifications.show({
          title: "Errore",
          message: err instanceof Error ? err.message : "Errore sconosciuto",
          color: "red",
        })
      )
      .finally(() => setLoadingMore(false));
  }, [selectedFolder, currentPage, loadingMore, PAGE_SIZE]);

  function handleFolderSelect(folderName: string) {
    setSearchQuery("");
    setSelectedFolder(folderName);
    if (isMobile) setMobileView("messages");
  }

  function handleMessageSelect(msg: PecMessageSummary) {
    setLoadingMessage(true);
    setEnvelopeMode(false);
    if (isMobile) setMessageModalOpen(true);
    fetchPecMessage(msg.folder, msg.uid, false)
      .then(setSelectedMessage)
      .catch((err: unknown) =>
        notifications.show({
          title: "Errore",
          message: err instanceof Error ? err.message : "Errore sconosciuto",
          color: "red",
        })
      )
      .finally(() => setLoadingMessage(false));
  }

  function handleToggleEnvelope() {
    if (!selectedMessage) return;
    const newMode = !envelopeMode;
    setEnvelopeMode(newMode);
    setLoadingMessage(true);
    fetchPecMessage(selectedMessage.folder, selectedMessage.uid, newMode)
      .then(setSelectedMessage)
      .catch((err: unknown) =>
        notifications.show({
          title: "Errore",
          message: err instanceof Error ? err.message : "Errore sconosciuto",
          color: "red",
        })
      )
      .finally(() => setLoadingMessage(false));
  }

  function handleToggleRead(msg: PecMessageSummary | PecMessage, read: boolean) {
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => (m.uid === msg.uid ? { ...m, read } : m))
    );
    setSelectedMessage((prev) =>
      prev && prev.uid === msg.uid ? { ...prev, read } : prev
    );
    setPecReadStatus(msg.folder, msg.uid, read).catch((err: unknown) => {
      // Revert optimistic update on failure
      setMessages((prev) =>
        prev.map((m) => (m.uid === msg.uid ? { ...m, read: !read } : m))
      );
      setSelectedMessage((prev) =>
        prev && prev.uid === msg.uid ? { ...prev, read: !read } : prev
      );
      notifications.show({
        title: "Errore",
        message: err instanceof Error ? err.message : "Errore sconosciuto",
        color: "red",
      });
    });
  }

  if (notConfigured) {
    return (
      <Alert
        icon={<IconMailExclamation />}
        title="PEC non configurata"
        color="yellow"
        mt="md"
      >
        Accesso alla casella PEC non configurato. Impostare le credenziali IMAP
        nella pagina{" "}
        <Text component="span" fw={600} size="sm">
          Impostazioni &rarr; PEC
        </Text>.
      </Alert>
    );
  }

  if (isMobile) {
    return (
      <Box style={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
        <Title order={4} mb="sm">Casella PEC</Title>
        <Box
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid var(--mantine-color-gray-3)",
            borderRadius: 8,
          }}
        >
          {mobileView === "folders" ? (
            <>
              <Box p="sm" style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}>
                <Text size="xs" fw={600} c="dimmed">CARTELLE</Text>
              </Box>
              <ScrollArea style={{ flex: 1 }}>
                <Box pos="relative" mih={40}>
                  <LoadingOverlay visible={loadingFolders} loaderProps={{ size: "xs" }} />
                  <FolderList folders={folders} selected={selectedFolder} onSelect={handleFolderSelect} />
                </Box>
              </ScrollArea>
            </>
          ) : (
            <>
              <Box p="sm" style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}>
                <Group gap="xs" mb={6}>
                  <ActionIcon variant="subtle" color="gray" onClick={() => setMobileView("folders")}>
                    <IconArrowLeft size={16} />
                  </ActionIcon>
                  <Text size="xs" fw={600} c="dimmed">{selectedFolder ?? "MESSAGGI"}</Text>
                </Group>
                <TextInput
                  size="xs"
                  placeholder="Cerca per oggetto, mittente o testo..."
                  leftSection={<IconSearch size={12} />}
                  rightSection={
                    searchQuery ? (
                      <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setSearchQuery("")}>
                        <IconX size={12} />
                      </ActionIcon>
                    ) : null
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                />
              </Box>
              <ScrollArea style={{ flex: 1 }}>
                <Box pos="relative" mih={40}>
                  <LoadingOverlay visible={loadingMessages} loaderProps={{ size: "xs" }} />
                  <MessageList
                    messages={messages}
                    selectedUid={selectedMessage?.uid ?? null}
                    onSelect={handleMessageSelect}
                    onToggleRead={handleToggleRead}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={handleLoadMore}
                  />
                </Box>
              </ScrollArea>
            </>
          )}
        </Box>

        <Modal
          opened={messageModalOpen}
          onClose={() => { setMessageModalOpen(false); setSelectedMessage(null); }}
          fullScreen
          padding={0}
          withCloseButton={false}
        >
          <Box pos="relative" style={{ height: "calc(100dvh - 60px)" }}>
            <LoadingOverlay visible={loadingMessage} loaderProps={{ size: "sm" }} />
            <MessageViewer
              message={selectedMessage}
              envelopeMode={envelopeMode}
              onToggleRead={handleToggleRead}
              onToggleEnvelope={handleToggleEnvelope}
              onClose={() => { setMessageModalOpen(false); setSelectedMessage(null); }}
            />
          </Box>
        </Modal>
      </Box>
    );
  }

  return (
    <Box
      style={{
        height: "calc(100vh - 100px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Title order={4} mb="sm">
        Casella PEC
      </Title>
      <Box
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
          border: "1px solid var(--mantine-color-gray-3)",
          borderRadius: 8,
        }}
      >
        {/* Folder list */}
        <Box
          w={220}
          style={{
            borderRight: "1px solid var(--mantine-color-gray-3)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            p="sm"
            style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
          >
            <Text size="xs" fw={600} c="dimmed">
              CARTELLE
            </Text>
          </Box>
          <ScrollArea style={{ flex: 1 }}>
            <Box pos="relative" mih={40}>
              <LoadingOverlay visible={loadingFolders} loaderProps={{ size: "xs" }} />
              <FolderList
                folders={folders}
                selected={selectedFolder}
                onSelect={handleFolderSelect}
              />
            </Box>
          </ScrollArea>
        </Box>

        {/* Message list */}
        <Box
          w={320}
          style={{
            borderRight: "1px solid var(--mantine-color-gray-3)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box
            p="sm"
            style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
          >
            <Text size="xs" fw={600} c="dimmed" mb={6}>
              {selectedFolder ?? "MESSAGGI"}
            </Text>
            <TextInput
              size="xs"
              placeholder="Cerca per oggetto, mittente o testo..."
              leftSection={<IconSearch size={12} />}
              rightSection={
                searchQuery ? (
                  <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => setSearchQuery("")}>
                    <IconX size={12} />
                  </ActionIcon>
                ) : null
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
            />
          </Box>
          <ScrollArea style={{ flex: 1 }}>
            <Box pos="relative" mih={40}>
              <LoadingOverlay visible={loadingMessages} loaderProps={{ size: "xs" }} />
              <MessageList
                messages={messages}
                selectedUid={selectedMessage?.uid ?? null}
                onSelect={handleMessageSelect}
                onToggleRead={handleToggleRead}
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={handleLoadMore}
              />
            </Box>
          </ScrollArea>
        </Box>

        {/* Message viewer */}
        <Box style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <Box pos="relative" style={{ flex: 1, overflow: "hidden" }}>
            <LoadingOverlay visible={loadingMessage} loaderProps={{ size: "sm" }} />
            <MessageViewer
              message={selectedMessage}
              envelopeMode={envelopeMode}
              onToggleRead={handleToggleRead}
              onToggleEnvelope={handleToggleEnvelope}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
