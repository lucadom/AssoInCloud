"use client";

import { useEffect, useRef, useState } from "react";
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
  Switch,
  Tabs,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconDatabase,
  IconDownload,
  IconLayoutDashboard,
  IconRefresh,
  IconUpload,
} from "@tabler/icons-react";
import { resetLayouts } from "@/lib/dashboard-layout";
import {
  downloadBackup,
  inspectBackupFile,
  restoreBackup,
} from "@/lib/api/backup";
import {
  type AppSettings,
  type DashboardCardKey,
  loadSettings,
  saveSettings,
} from "@/lib/settings";

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

  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  // Load settings from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setAppSettings(loadSettings());
  }, []);

  function handleCardVisibilityChange(cardKey: DashboardCardKey, visible: boolean): void {
    setAppSettings((prev) => {
      if (!prev) return prev;
      const next: AppSettings = {
        ...prev,
        dashboard: {
          ...prev.dashboard,
          visibleCards: { ...prev.dashboard.visibleCards, [cardKey]: visible },
        },
      };
      saveSettings(next);
      return next;
    });
  }

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
      <Stack gap="xl" maw={700}>
        <Title order={2}>Impostazioni</Title>

        <Tabs defaultValue="dashboard" variant="outline">
          <Tabs.List mb="xl">
            <Tabs.Tab value="dashboard" leftSection={<IconLayoutDashboard size={16} />}>
              Dashboard
            </Tabs.Tab>
            <Tabs.Tab value="backup" leftSection={<IconDatabase size={16} />}>
              Backup e ripristino
            </Tabs.Tab>
          </Tabs.List>

          {/* --- Tab: Dashboard --- */}
          <Tabs.Panel value="dashboard">
            <Stack gap="md" maw={500}>
              <Text size="sm" c="dimmed">
                Scegli quali card visualizzare nella Dashboard.
              </Text>
              <Stack gap="xs">
                {([
                  { key: "fatture-mese",  label: "Fatture mese corrente" },
                  { key: "fatture-prev",  label: "Fatture 3 mesi precedenti" },
                  { key: "fornitori",     label: "Fornitori" },
                  { key: "soci",          label: "Soci" },
                  { key: "compleanno",    label: "Prossimo compleanno" },
                  { key: "grafico",       label: "Grafico andamento fatture" },
                ] as { key: DashboardCardKey; label: string }[]).map(({ key, label }) => (
                  <Switch
                    key={key}
                    label={label}
                    checked={appSettings?.dashboard.visibleCards[key] ?? true}
                    disabled={appSettings === null}
                    onChange={(e) => handleCardVisibilityChange(key, e.currentTarget.checked)}
                  />
                ))}
              </Stack>

              <Divider />

              <Stack gap="xs">
                <Text size="sm" fw={500}>Posizione e dimensione delle card</Text>
                <Text size="sm" c="dimmed">
                  Ripristina la posizione e la dimensione di tutte le card ai valori predefiniti.
                </Text>
                <Group>
                  <Button
                    variant="default"
                    leftSection={<IconRefresh size={16} />}
                    onClick={() => {
                      resetLayouts();
                      notifications.show({
                        title: "Layout ripristinato",
                        message: "Le card sono tornate alla posizione e dimensione predefinite",
                        color: "green",
                      });
                    }}
                  >
                    Ripristina layout predefinito
                  </Button>
                </Group>
              </Stack>
            </Stack>
          </Tabs.Panel>

          {/* --- Tab: Backup e ripristino --- */}
          <Tabs.Panel value="backup">
            <Stack gap="xl" maw={500}>
              {/* Backup */}
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

              {/* Restore */}
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
          </Tabs.Panel>
        </Tabs>
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
