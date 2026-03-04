"use client";

"use client";

import { useRef, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Divider,
  FileInput,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconDownload,
  IconUpload,
} from "@tabler/icons-react";
import {
  downloadBackup,
  inspectBackupFile,
  restoreBackup,
} from "@/lib/api/backup";

interface SettingsPageProps {
  dbVersion: string | null;
}

export function SettingsPage({ dbVersion: currentVersion }: SettingsPageProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileVersion, setFileVersion] = useState<string | null>(null);
  const [fileInspecting, setFileInspecting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [downloadLoading, setDownloadLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const [confirmOpened, confirmHandlers] = useDisclosure(false);

  const fileInputRef = useRef<HTMLButtonElement>(null);

  async function handleFileChange(file: File | null) {
    setSelectedFile(file);
    setFileVersion(null);
    setFileError(null);

    if (!file) return;

    setFileInspecting(true);
    try {
      const data = await inspectBackupFile(file);
      setFileVersion(data.version);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : "Errore nella lettura del file");
      setSelectedFile(null);
    } finally {
      setFileInspecting(false);
    }
  }

  async function handleDownload() {
    setDownloadLoading(true);
    try {
      await downloadBackup();
    } catch {
      notifications.show({
        title: "Errore",
        message: "Impossibile scaricare il backup",
        color: "red",
      });
    } finally {
      setDownloadLoading(false);
    }
  }

  async function handleRestoreConfirm() {
    if (!selectedFile) return;
    setRestoreLoading(true);
    try {
      await restoreBackup(selectedFile);
      confirmHandlers.close();
      setSelectedFile(null);
      setFileVersion(null);
      notifications.show({
        title: "Ripristino completato",
        message: "Il database è stato ripristinato con successo",
        color: "green",
      });
    } catch (err) {
      notifications.show({
        title: "Errore",
        message: err instanceof Error ? err.message : "Errore durante il ripristino del database",
        color: "red",
      });
    } finally {
      setRestoreLoading(false);
    }
  }

  const versionsMatch = currentVersion !== null && fileVersion !== null && currentVersion === fileVersion;
  const versionMismatch = currentVersion !== null && fileVersion !== null && currentVersion !== fileVersion;

  return (
    <>
      <Stack gap="xl" maw={600}>
        <Title order={2}>Impostazioni</Title>

        {/* Backup section */}
        <Stack gap="xs">
          <Group gap="sm" align="center">
            <IconDownload size={20} />
            <Title order={4}>Backup dei dati</Title>
          </Group>
          <Text size="sm" c="dimmed">
            Scarica una copia completa del database. Il file può essere usato per ripristinare i dati in caso di necessità.
          </Text>
          <Group>
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={handleDownload}
              loading={downloadLoading}
            >
              Scarica backup
            </Button>
          </Group>
        </Stack>

        <Divider />

        {/* Restore section */}
        <Stack gap="sm">
          <Group gap="sm" align="center">
            <IconUpload size={20} />
            <Title order={4}>Ripristino dei dati</Title>
          </Group>
          <Text size="sm" c="dimmed">
            Ripristina il database da un file di backup precedentemente scaricato.
            <strong> I dati attuali verranno sovrascritti.</strong>
          </Text>

          <FileInput
            ref={fileInputRef}
            accept=".db"
            placeholder="Seleziona file di backup (.db)"
            value={selectedFile}
            onChange={handleFileChange}
            disabled={fileInspecting}
            rightSection={fileInspecting ? <Loader size="xs" /> : undefined}
            clearable
          />

          {fileError && (
            <Text size="sm" c="red">{fileError}</Text>
          )}

          {fileVersion && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">Versione nel file:</Text>
              <Badge variant="light" color={versionsMatch ? "green" : "orange"}>
                v{fileVersion}
              </Badge>
              {versionsMatch && (
                <Text size="sm" c="green">Compatibile con la versione corrente</Text>
              )}
              {versionMismatch && (
                <Text size="sm" c="orange">Versione diversa da quella corrente</Text>
              )}
            </Group>
          )}

          <Group>
            <Button
              leftSection={<IconUpload size={16} />}
              color="red"
              onClick={confirmHandlers.open}
              disabled={!selectedFile || fileInspecting}
            >
              Ripristina da file
            </Button>
          </Group>
        </Stack>
      </Stack>

      {/* Restore confirmation modal */}
      <Modal
        opened={confirmOpened}
        onClose={confirmHandlers.close}
        title="Conferma ripristino"
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            Stai per sovrascrivere <strong>tutti i dati attuali</strong> con quelli contenuti nel file di backup.
            Questa operazione non può essere annullata.
          </Text>

          {versionMismatch && (
            <Alert
              color="yellow"
              icon={<IconAlertTriangle size={16} />}
              title="Versione diversa"
            >
              La versione del file di backup (<strong>v{fileVersion}</strong>) è diversa dalla versione
              attuale del database (<strong>v{currentVersion}</strong>).
              Il ripristino potrebbe causare problemi di compatibilità con la versione corrente dell&apos;applicazione.
            </Alert>
          )}

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={confirmHandlers.close} disabled={restoreLoading}>
              Annulla
            </Button>
            <Button
              color="red"
              onClick={handleRestoreConfirm}
              loading={restoreLoading}
            >
              Conferma ripristino
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
