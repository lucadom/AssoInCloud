"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  AppShell,
  Badge,
  Burger,
  NavLink,
  Title,
  Group,
  ThemeIcon,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconFileInvoice,
  IconUsers,
  IconPackages,
  IconListDetails,
  IconCake,
  IconUserCheck,
  IconLogout,
  IconSettings,
  IconLayoutDashboard,
} from "@tabler/icons-react";
import { InvoicesPage } from "./invoices-page";
import { SuppliersPage } from "./suppliers-page";
import { ProductsPage } from "./products-page";
import { PriceListPage } from "./price-list-page";
import { BirthdaysPage } from "./birthdays-page";
import { MembersPage } from "./members-page";
import { logout } from "@/lib/api/auth";
import { fetchCurrentVersion } from "@/lib/api/backup";
import { SettingsPage } from "./settings-page";
const DashboardPage = dynamic(
  async () => {
    const mod = await import("./dashboard-page");
    return { default: mod.DashboardPage };
  },
  { ssr: false }
);

type Page = "dashboard" | "invoices" | "suppliers" | "products" | "price-lists" | "members" | "birthdays" | "settings";

const navItems: { label: string; value: Page; icon: typeof IconFileInvoice }[] = [
  { label: "Dashboard", value: "dashboard", icon: IconLayoutDashboard },
  { label: "Fatture", value: "invoices", icon: IconFileInvoice },
  { label: "Fornitori", value: "suppliers", icon: IconUsers },
  { label: "Prodotti", value: "products", icon: IconPackages },
  { label: "Listini", value: "price-lists", icon: IconListDetails },
];

export function AppLayout() {
  const router = useRouter();
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [opened, { toggle, close }] = useDisclosure();
  const [dbVersion, setDbVersion] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentVersion()
      .then((data) => setDbVersion(data.version))
      .catch(() => setDbVersion(null));
  }, []);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  function handleNavClick(page: Page) {
    setActivePage(page);
    close();
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 250, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4}>AssoInCloud</Title>
            {dbVersion !== null && (
              <Badge variant="light" color="gray" size="sm">v{dbVersion}</Badge>
            )}
          </Group>
          <Tooltip label="Esci">
            <ActionIcon variant="subtle" color="gray" onClick={handleLogout}>
              <IconLogout size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          {navItems.map((item) => (
            <NavLink
              key={item.value}
              label={item.label}
              active={activePage === item.value}
              onClick={() => handleNavClick(item.value)}
              leftSection={
                <ThemeIcon variant="light" size="sm">
                  <item.icon size={14} />
                </ThemeIcon>
              }
            />
          ))}
          <NavLink
            label="Soci"
            active={activePage === "members" || activePage === "birthdays"}
            leftSection={
              <ThemeIcon variant="light" size="sm">
                <IconUserCheck size={14} />
              </ThemeIcon>
            }
          >
            <NavLink
              label="Elenco"
              active={activePage === "members"}
              onClick={() => handleNavClick("members")}
              leftSection={
                <ThemeIcon variant="light" size="sm">
                  <IconUsers size={14} />
                </ThemeIcon>
              }
            />
            <NavLink
              label="Compleanni"
              active={activePage === "birthdays"}
              onClick={() => handleNavClick("birthdays")}
              leftSection={
                <ThemeIcon variant="light" size="sm">
                  <IconCake size={14} />
                </ThemeIcon>
              }
            />
          </NavLink>
          <NavLink
            label="Impostazioni"
            active={activePage === "settings"}
            onClick={() => handleNavClick("settings")}
            leftSection={
              <ThemeIcon variant="light" size="sm">
                <IconSettings size={14} />
              </ThemeIcon>
            }
          />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        {activePage === "dashboard" && <DashboardPage />}
        {activePage === "invoices" && <InvoicesPage />}
        {activePage === "suppliers" && <SuppliersPage />}
        {activePage === "products" && <ProductsPage />}
        {activePage === "price-lists" && <PriceListPage />}
        {activePage === "members" && <MembersPage />}
        {activePage === "birthdays" && <BirthdaysPage />}
        {activePage === "settings" && <SettingsPage dbVersion={dbVersion} />}
      </AppShell.Main>
    </AppShell>
  );
}
