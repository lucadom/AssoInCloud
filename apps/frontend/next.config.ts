import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: [
      "@mantine/core",
      "@mantine/hooks",
      "@mantine/dates",
      "@mantine/dropzone",
      "@mantine/notifications",
      "@mantine/modals",
      "@tabler/icons-react",
    ],
  },
};

export default nextConfig;
