"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Center,
  Card,
  Title,
  Text,
  PasswordInput,
  Button,
  Stack,
  Alert,
  Loader,
} from "@mantine/core";
import { IconLock, IconAlertCircle } from "@tabler/icons-react";
import { login, fetchAuthStatus } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if auth is even enabled; if not redirect straight to home
    fetchAuthStatus()
      .then((status) => {
        if (!status.authEnabled) {
          // Set a cookie so the middleware won't redirect again
          document.cookie =
            "assoincloud_auth_disabled=true; path=/; max-age=3600; SameSite=Lax";
          router.replace("/");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        setChecking(false);
      });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il login");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <Center mih="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Center mih="100vh" p="md">
      <Card shadow="md" padding="xl" radius="md" withBorder w="100%" maw={400}>
        <Stack align="center" gap="md">
          <IconLock size={48} stroke={1.5} />
          <Title order={2}>AssoInCloud</Title>
          <Text c="dimmed" size="sm" ta="center">
            Inserisci la password per accedere all&apos;applicazione
          </Text>
        </Stack>

        <form onSubmit={handleSubmit}>
          <Stack mt="lg" gap="md">
            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                color="red"
                variant="light"
              >
                {error}
              </Alert>
            )}

            <PasswordInput
              label="Password"
              placeholder="Password di accesso"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              autoFocus
            />

            <Button type="submit" fullWidth loading={loading}>
              Accedi
            </Button>
          </Stack>
        </form>
      </Card>
    </Center>
  );
}
