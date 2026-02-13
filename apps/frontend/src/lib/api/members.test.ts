import { describe, expect, it, vi } from "vitest";
import { exportMembersXlsx } from "./members";
import { authFetch } from "./auth-fetch";

vi.mock("./auth-fetch", () => ({
  authFetch: vi.fn(),
}));

describe("exportMembersXlsx", () => {
  it("should return a blob on success", async () => {
    const blob = new Blob(["test"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    vi.mocked(authFetch).mockResolvedValueOnce(
      new Response(blob, { status: 200 })
    );

    const result = await exportMembersXlsx();

    expect(result).toBeInstanceOf(Blob);
    expect(authFetch).toHaveBeenCalledWith(
      "/members/export-xlsx",
      expect.objectContaining({
        method: "GET",
        headers: {
          Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      })
    );
  });

  it("should throw an error when response is not ok", async () => {
    vi.mocked(authFetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Errore" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(exportMembersXlsx()).rejects.toThrow(
      "Errore nell'esportazione dei soci"
    );
  });
});
