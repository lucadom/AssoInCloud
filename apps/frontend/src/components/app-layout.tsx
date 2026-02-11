"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppShell,
  NavLink,
  Title,
  Group,
  ThemeIcon,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconFileInvoice,
  IconUsers,
  IconPackages,
  IconLogout,
} from "@tabler/icons-react";
import { InvoicesPage } from "./invoices-page";
import { SuppliersPage } from "./suppliers-page";
import { ProductsPage } from "./products-page";
import { logout } from "@/lib/api/auth";

type Page = "invoices" | "suppliers" | "products";

const navItems: { label: string; value: Page; icon: typeof IconFileInvoice }[] = [
  { label: "Fatture", value: "invoices", icon: IconFileInvoice },
  { label: "Fornitori", value: "suppliers", icon: IconUsers },
  { label: "Prodotti", value: "products", icon: IconPackages },
];

export function AppLayout() {
  const router = useRouter();
  const [activePage, setActivePage] = useState<Page>("invoices");

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <AppShell
      navbar={{ width: 250, breakpoint: "sm" }}
      padding="md"
    >
      <AppShell.Navbar p="md">
        <AppShell.Section>
          <Group mb="md" justify="space-between">
            <Title order={4}>Menu</Title>
            <Tooltip label="Esci">
              <ActionIcon variant="subtle" color="gray" onClick={handleLogout}>
                <IconLogout size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </AppShell.Section>
        <AppShell.Section grow>
          {navItems.map((item) => (
            <NavLink
              key={item.value}
              label={item.label}
              active={activePage === item.value}
              onClick={() => setActivePage(item.value)}
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
      </AppShell.Main>
    </AppShell>
  );
}
