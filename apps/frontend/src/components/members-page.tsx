"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Group, LoadingOverlay, Stack, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconDownload, IconFileSpreadsheet, IconPlus } from "@tabler/icons-react";
import type { Member } from "@/types";
import * as api from "@/lib/api/members";
import { MembersTable } from "./members/members-table";
import { MemberFormModal, type MemberFormValues } from "./members/member-form-modal";
import { CsvUploadModal } from "./members/csv-upload-modal";
import { DeleteConfirmModal } from "./members/delete-confirm-modal";

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [csvModalOpened, csvModalHandlers] = useDisclosure(false);
  const [formModalOpened, formModalHandlers] = useDisclosure(false);
  const [deleteModalOpened, deleteModalHandlers] = useDisclosure(false);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchMembers();
      setMembers(data);
    } catch {
      notifications.show({
        title: "Errore",
        message: "Impossibile caricare i soci",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // --- Handlers ---

  const handleCreate = () => {
    setSelectedMember(null);
    formModalHandlers.open();
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    formModalHandlers.open();
  };

  const handleDeleteClick = (member: Member) => {
    setSelectedMember(member);
    deleteModalHandlers.open();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMember) return;
    setActionLoading(true);
    try {
      await api.deleteMember(selectedMember.id);
      notifications.show({
        title: "Socio eliminato",
        message: "Il socio è stato eliminato con successo",
        color: "green",
      });
      deleteModalHandlers.close();
      await loadMembers();
    } catch (error: unknown) {
      notifications.show({
        title: "Errore",
        message: error instanceof Error ? error.message : "Impossibile eliminare il socio",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFormSubmit = async (values: MemberFormValues) => {
    setActionLoading(true);
    try {
      const payload = {
        lastName: values.lastName,
        firstName: values.firstName,
        birthDate: values.birthDate?.toISOString().split("T")[0],
        birthPlace: values.birthPlace || undefined,
        fiscalCode: values.fiscalCode,
        address: values.address || undefined,
        city: values.city || undefined,
        phone: values.phone || undefined,
        membershipDate: values.membershipDate?.toISOString().split("T")[0],
      };

      if (selectedMember) {
        await api.updateMember(selectedMember.id, payload);
        notifications.show({
          title: "Socio aggiornato",
          message: "Il socio è stato aggiornato con successo",
          color: "green",
        });
      } else {
        await api.createMember(payload);
        notifications.show({
          title: "Socio creato",
          message: "Il socio è stato creato con successo",
          color: "green",
        });
      }

      formModalHandlers.close();
      await loadMembers();
    } catch (error: unknown) {
      notifications.show({
        title: "Errore",
        message: error instanceof Error ? error.message : "Impossibile salvare il socio",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCsvUpload = async (file: File) => {
    setActionLoading(true);
    try {
      const result = await api.uploadMembersCsv(file);
      notifications.show({
        title: "Importazione completata",
        message: `${result.imported} soci importati, ${result.updated} aggiornati, ${result.skipped} saltati`,
        color: result.skipped > 0 ? "yellow" : "green",
      });
      csvModalHandlers.close();
      await loadMembers();
    } catch (error: unknown) {
      notifications.show({
        title: "Errore",
        message: error instanceof Error ? error.message : "Impossibile importare il CSV",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    setActionLoading(true);
    try {
      const blob = await api.exportMembersXlsx();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `soci_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notifications.show({
        title: "Esportazione completata",
        message: "Il file XLSX dei soci e' stato scaricato",
        color: "green",
      });
    } catch (error: unknown) {
      notifications.show({
        title: "Errore",
        message: error instanceof Error ? error.message : "Impossibile esportare i soci",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Soci</Title>
        <Group>
          <Button
            leftSection={<IconFileSpreadsheet size={16} />}
            variant="light"
            onClick={csvModalHandlers.open}
          >
            Carica CSV
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            variant="light"
            onClick={handleExport}
            loading={actionLoading}
          >
            Esporta XLSX
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreate}
          >
            Nuovo socio
          </Button>
        </Group>
      </Group>

      <LoadingOverlay visible={loading} />
      <MembersTable
        members={members}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <MemberFormModal
        member={selectedMember}
        opened={formModalOpened}
        onClose={formModalHandlers.close}
        onSubmit={handleFormSubmit}
        loading={actionLoading}
      />

      <CsvUploadModal
        opened={csvModalOpened}
        onClose={csvModalHandlers.close}
        onUpload={handleCsvUpload}
        loading={actionLoading}
      />

      <DeleteConfirmModal
        member={selectedMember}
        opened={deleteModalOpened}
        onClose={deleteModalHandlers.close}
        onConfirm={handleDeleteConfirm}
        loading={actionLoading}
      />
    </Stack>
  );
}
