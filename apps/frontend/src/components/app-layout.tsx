"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppShell,
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
  IconLogout,
} from "@tabler/icons-react";
import { InvoicesPage } from "./invoices-page";
import { SuppliersPage } from "./suppliers-page";
import { ProductsPage } from "./products-page";
import { PriceListPage } from "./price-list-page";
import { logout } from "@/lib/api/auth";

type Page = "invoices" | "suppliers" | "products" | "price-lists";

const navItems: { label: string; value: Page; icon: typeof IconFileInvoice }[] = [
  { label: "Fatture", value: "invoices", icon: IconFileInvoice },
  { label: "Fornitori", value: "suppliers", icon: IconUsers },
  { label: "Prodotti", value: "products", icon: IconPackages },
  { label: "Listini", value: "price-lists", icon: IconListDetails },
];

export function AppLayout() {
  const router = useRouter();
  const [activePage, setActivePage] = useState<Page>("invoices");
  const [opened, { toggle, close }] = useDisclosure();

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
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        {activePage === "invoices" && <InvoicesPage />}
        {activePage === "suppliers" && <SuppliersPage />}
        {activePage === "products" && <ProductsPage />}
        {activePage === "price-lists" && <PriceListPage />}
      </AppShell.Main>
    </AppShell>
  );
}
