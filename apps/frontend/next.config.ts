import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_OUTPUT === "export";
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? { output: "export" as const }
    : {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: `${backendUrl}/api/:path*`,
            },
          ];
        },
      }),
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
