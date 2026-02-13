"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, LoadingOverlay, Stack, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { Member } from "@/types";
import * as api from "@/lib/api/members";
import { BirthdaysSummary } from "./members/birthdays-summary";

export function BirthdaysPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <Stack gap="md">
      <Title order={2}>Compleanni</Title>
      <Box pos="relative">
        <LoadingOverlay visible={loading} />
        <BirthdaysSummary members={members} />
      </Box>
    </Stack>
  );
}
