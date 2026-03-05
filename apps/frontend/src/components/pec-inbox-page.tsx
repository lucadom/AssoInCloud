"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  LoadingOverlay,
  ScrollArea,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconMailExclamation } from "@tabler/icons-react";
import type { PecFolder, PecMessage, PecMessageSummary } from "@/types";
import {
  fetchPecFolders,
  fetchPecMessage,
  fetchPecMessages,
  isPecNotConfiguredError,
  setPecReadStatus,
} from "@/lib/api/pec";
import { FolderList } from "./pec/folder-list";
import { MessageList } from "./pec/message-list";
import { MessageViewer } from "./pec/message-viewer";

export function PecInboxPage() {
  const [notConfigured, setNotConfigured] = useState(false);
  const [folders, setFolders] = useState<PecFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [messages, setMessages] = useState<PecMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<PecMessage | null>(
    null
  );
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [envelopeMode, setEnvelopeMode] = useState(false);

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
    fetchPecMessages(folderName)
      .then(setMessages)
      .catch((err: unknown) =>
        notifications.show({
          title: "Errore",
          message: err instanceof Error ? err.message : "Errore sconosciuto",
          color: "red",
        })
      )
      .finally(() => setLoadingMessages(false));
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      loadMessages(selectedFolder);
    }
  }, [selectedFolder, loadMessages]);

  function handleFolderSelect(folderName: string) {
    setSelectedFolder(folderName);
  }

  function handleMessageSelect(msg: PecMessageSummary) {
    setLoadingMessage(true);
    setEnvelopeMode(false);
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
        Accesso alla casella PEC non configurato. Impostare le variabili
        d&apos;ambiente{" "}
        <Text component="span" fw={600} size="sm">
          ASSOINCLOUD_PEC_HOST, ASSOINCLOUD_PEC_USERNAME,
          ASSOINCLOUD_PEC_PASSWORD
        </Text>{" "}
        e riavviare l&apos;applicazione.
      </Alert>
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
            <Text size="xs" fw={600} c="dimmed">
              {selectedFolder ?? "MESSAGGI"}
            </Text>
          </Box>
          <ScrollArea style={{ flex: 1 }}>
            <Box pos="relative" mih={40}>
              <LoadingOverlay visible={loadingMessages} loaderProps={{ size: "xs" }} />
              <MessageList
                messages={messages}
                selectedUid={selectedMessage?.uid ?? null}
                onSelect={handleMessageSelect}
                onToggleRead={handleToggleRead}
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
