import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UploadZone } from "../upload-zone";
import { MantineProvider } from "@mantine/core";

vi.mock("@/lib/api/documents", () => ({
  uploadFiles: vi.fn().mockResolvedValue([]),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>{children}</MantineProvider>
);

describe("UploadZone", () => {
  it("renders children", () => {
    render(
      <UploadZone currentPath="" onUploadComplete={vi.fn()}>
        <div>child content</div>
      </UploadZone>,
      { wrapper }
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });
});
