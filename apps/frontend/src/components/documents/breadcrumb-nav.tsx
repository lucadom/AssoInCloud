"use client";

import { Breadcrumbs, Anchor, Text } from "@mantine/core";

interface BreadcrumbNavProps {
  path: string;
  onNavigate: (path: string) => void;
}

export function BreadcrumbNav({ path, onNavigate }: BreadcrumbNavProps) {
  const segments = path ? path.split("/") : [];

  const items = [
    <Anchor key="root" onClick={() => onNavigate("")} size="sm">
      Documenti
    </Anchor>,
    ...segments.map((seg, i) => {
      const segPath = segments.slice(0, i + 1).join("/");
      const isLast = i === segments.length - 1;
      return isLast ? (
        <Text key={segPath} size="sm" fw={500}>
          {seg}
        </Text>
      ) : (
        <Anchor key={segPath} onClick={() => onNavigate(segPath)} size="sm">
          {seg}
        </Anchor>
      );
    }),
  ];

  return <Breadcrumbs>{items}</Breadcrumbs>;
}
