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
  const [renewingMemberId, setRenewingMemberId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

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

  const filteredMembers = useCallback((): Member[] => {
    switch (statusFilter) {
      case "active":
        return members.filter((m) => m.active);
      case "inactive":
        return members.filter((m) => !m.active);
      default:
        return members;
    }
  }, [members, statusFilter]);

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
      const membershipYears = values.membershipYears
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .map((value) => Number.parseInt(value, 10));

      const hasInvalidMembershipYear = membershipYears.some(
        (year) => Number.isNaN(year) || year < 1900 || year > new Date().getFullYear() + 20,
      );

      if (hasInvalidMembershipYear) {
        notifications.show({
          title: "Errore",
          message: "Inserisci solo anni di iscrizione validi (4 cifre)",
          color: "red",
        });
        return;
      }

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
        membershipYears,
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

  const handleRenewMembership = async (member: Member) => {
    setRenewingMemberId(member.id);
    try {
      const updated = await api.renewMembership(member.id);
      notifications.show({
        title: "Iscrizione rinnovata",
        message: `L'iscrizione di ${member.firstName} ${member.lastName} è stata rinnovata`,
        color: "green",
      });
      await loadMembers();
    } catch (error: unknown) {
      notifications.show({
        title: "Errore",
        message: error instanceof Error ? error.message : "Impossibile rinnovare l'iscrizione",
        color: "red",
      });
    } finally {
      setRenewingMemberId(undefined);
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

  const handleExportActive = async () => {
    setActionLoading(true);
    try {
      const blob = await api.exportActiveMembersXlsx();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `soci_attivi_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notifications.show({
        title: "Esportazione completata",
        message: "Il file XLSX dei soci attivi e' stato scaricato",
        color: "green",
      });
    } catch (error: unknown) {
      notifications.show({
        title: "Errore",
        message: error instanceof Error ? error.message : "Impossibile esportare i soci attivi",
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
            leftSection={<IconDownload size={16} />}
            variant="light"
            onClick={handleExportActive}
            loading={actionLoading}
          >
            Esporta Attivi
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreate}
          >
            Nuovo socio
          </Button>
        </Group>
      </Group>

      <Group gap="xs">
        <Button
          variant={statusFilter === "all" ? "filled" : "light"}
          size="sm"
          onClick={() => setStatusFilter("all")}
        >
          Tutti ({members.length})
        </Button>
        <Button
          variant={statusFilter === "active" ? "filled" : "light"}
          size="sm"
          onClick={() => setStatusFilter("active")}
          color="green"
        >
          Attivi ({members.filter((m) => m.active).length})
        </Button>
        <Button
          variant={statusFilter === "inactive" ? "filled" : "light"}
          size="sm"
          onClick={() => setStatusFilter("inactive")}
          color="gray"
        >
          Inattivi ({members.filter((m) => !m.active).length})
        </Button>
      </Group>

      <LoadingOverlay visible={loading} />
      <MembersTable
        members={filteredMembers()}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onRenew={handleRenewMembership}
        renewingMemberId={renewingMemberId}
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
