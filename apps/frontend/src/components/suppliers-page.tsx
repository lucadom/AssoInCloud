"use client";

import { useCallback, useEffect, useState } from "react";
import { Title, Button, Group, Stack, LoadingOverlay, Box } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import type { Supplier } from "@/types";
import * as api from "@/lib/api/suppliers";
import { SuppliersTable } from "./suppliers/suppliers-table";
import { SupplierFormModal, type SupplierFormValues } from "./suppliers/supplier-form-modal";
import { SupplierDeleteModal } from "./suppliers/supplier-delete-modal";

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const [formModalOpened, formModalHandlers] = useDisclosure(false);
  const [deleteModalOpened, deleteModalHandlers] = useDisclosure(false);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchSuppliers();
      setSuppliers(data);
    } catch {
      notifications.show({
        title: "Errore",
        message: "Impossibile caricare i fornitori",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleCreate = () => {
    setSelectedSupplier(null);
    formModalHandlers.open();
  };

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    formModalHandlers.open();
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    deleteModalHandlers.open();
  };

  const handleFormSubmit = async (values: SupplierFormValues) => {
    setActionLoading(true);
    try {
      const payload = {
        name: values.name,
        vatNumber: values.vatNumber,
      };

      if (selectedSupplier) {
        await api.updateSupplier(selectedSupplier.id, payload);
        notifications.show({
          title: "Fornitore aggiornato",
          message: "Le modifiche sono state salvate",
          color: "green",
        });
      } else {
        await api.createSupplier(payload);
        notifications.show({
          title: "Fornitore creato",
          message: "Il fornitore è stato creato con successo",
          color: "green",
        });
      }
      formModalHandlers.close();
      await loadSuppliers();
    } catch (e) {
      notifications.show({
        title: "Errore",
        message: e instanceof Error ? e.message : "Impossibile salvare il fornitore",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSupplier) return;
    setActionLoading(true);
    try {
      await api.deleteSupplier(selectedSupplier.id);
      notifications.show({
        title: "Fornitore eliminato",
        message: "Il fornitore è stato eliminato con successo",
        color: "green",
      });
      deleteModalHandlers.close();
      await loadSuppliers();
    } catch (e) {
      notifications.show({
        title: "Errore",
        message: e instanceof Error ? e.message : "Impossibile eliminare il fornitore",
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Title order={2}>Fornitori</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleCreate} size="sm">
          Nuovo Fornitore
        </Button>
      </Group>

      <Box pos="relative" mih={200}>
        <LoadingOverlay visible={loading} />
        <SuppliersTable
          suppliers={suppliers}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </Box>

      <SupplierFormModal
        supplier={selectedSupplier}
        opened={formModalOpened}
        onClose={formModalHandlers.close}
        onSubmit={handleFormSubmit}
        loading={actionLoading}
      />
      <SupplierDeleteModal
        supplier={selectedSupplier}
        opened={deleteModalOpened}
        onClose={deleteModalHandlers.close}
        onConfirm={handleDeleteConfirm}
        loading={actionLoading}
      />
    </Stack>
  );
}
