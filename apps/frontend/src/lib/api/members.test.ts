import { describe, expect, it, vi } from "vitest";
import {
  fetchMembers,
  fetchMember,
  createMember,
  updateMember,
  deleteMember,
  uploadMembersCsv,
  exportMembersXlsx,
} from "./members";
import { authFetch } from "./auth-fetch";

vi.mock("./auth-fetch", () => ({
  authFetch: vi.fn(),
}));

const mockAuthFetch = vi.mocked(authFetch);

const mockMember = {
  id: "m1",
  lastName: "Rossi",
  firstName: "Marco",
  fiscalCode: "RSSMRC80A01H501U",
};

describe("fetchMembers", () => {
  it("should return members list on success", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([mockMember]), { status: 200 })
    );
    const result = await fetchMembers();
    expect(result).toEqual([mockMember]);
    expect(mockAuthFetch).toHaveBeenCalledWith("/members");
  });

  it("should throw on error", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    await expect(fetchMembers()).rejects.toThrow(
      "Errore nel caricamento dei soci"
    );
  });
});

describe("fetchMember", () => {
  it("should return member on success", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockMember), { status: 200 })
    );
    const result = await fetchMember("m1");
    expect(result).toEqual(mockMember);
    expect(mockAuthFetch).toHaveBeenCalledWith("/members/m1");
  });

  it("should throw on error", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("{}", { status: 404 }));
    await expect(fetchMember("bad-id")).rejects.toThrow("Socio non trovato");
  });
});

describe("createMember", () => {
  it("should return created member on success", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockMember), { status: 201 })
    );
    const formData = { lastName: "Rossi", firstName: "Marco", fiscalCode: "RSSMRC80A01H501U" };
    const result = await createMember(formData as never);
    expect(result).toEqual(mockMember);
  });

  it("should throw error message from body", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Codice fiscale duplicato" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );
    await expect(createMember({} as never)).rejects.toThrow(
      "Codice fiscale duplicato"
    );
  });

  it("should throw fallback on empty body", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("bad", { status: 400 }));
    await expect(createMember({} as never)).rejects.toThrow(
      "Errore nella creazione del socio"
    );
  });
});

describe("updateMember", () => {
  it("should return updated member on success", async () => {
    const updated = { ...mockMember, firstName: "Mario" };
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(updated), { status: 200 })
    );
    const result = await updateMember("m1", { firstName: "Mario" } as never);
    expect(result.firstName).toBe("Mario");
  });

  it("should throw error from body", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Socio non trovato" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    );
    await expect(updateMember("bad", {} as never)).rejects.toThrow(
      "Socio non trovato"
    );
  });

  it("should throw fallback on empty body", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("bad", { status: 500 }));
    await expect(updateMember("m1", {} as never)).rejects.toThrow(
      "Errore nell'aggiornamento del socio"
    );
  });
});

describe("deleteMember", () => {
  it("should succeed on 204", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(deleteMember("m1")).resolves.toBeUndefined();
    expect(mockAuthFetch).toHaveBeenCalledWith("/members/m1", expect.objectContaining({ method: "DELETE" }));
  });

  it("should throw error from body", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Errore eliminazione" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );
    await expect(deleteMember("m1")).rejects.toThrow("Errore eliminazione");
  });

  it("should throw fallback on empty body", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("bad", { status: 500 }));
    await expect(deleteMember("m1")).rejects.toThrow(
      "Errore nell'eliminazione del socio"
    );
  });
});

describe("uploadMembersCsv", () => {
  it("should return import result on success", async () => {
    const importResult = { imported: 5, updated: 1, skipped: 0 };
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(importResult), { status: 200 })
    );
    const file = new File(["csv"], "members.csv", { type: "text/csv" });
    const result = await uploadMembersCsv(file);
    expect(result).toEqual(importResult);
    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/members/import-csv",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("should throw error from body", async () => {
    mockAuthFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "CSV non valido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    );
    const file = new File(["bad"], "bad.csv");
    await expect(uploadMembersCsv(file)).rejects.toThrow("CSV non valido");
  });

  it("should throw fallback on empty body", async () => {
    mockAuthFetch.mockResolvedValueOnce(new Response("bad", { status: 500 }));
    const file = new File(["bad"], "bad.csv");
    await expect(uploadMembersCsv(file)).rejects.toThrow(
      "Errore nell'importazione del CSV"
    );
  });
});

describe("exportMembersXlsx", () => {
  it("should return a blob on success", async () => {
    const blob = new Blob(["test"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    vi.mocked(authFetch).mockResolvedValueOnce(
      new Response(blob, { status: 200 })
    );

    const result = await exportMembersXlsx();

    // In jsdom the Blob returned by res.blob() may come from a different realm;
    // verify duck-typed Blob properties instead of instanceof.
    expect(typeof result.arrayBuffer).toBe("function");
    expect(result.size).toBeGreaterThan(0);
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
    // Empty JSON body → body?.error is undefined → fallback message is used.
    vi.mocked(authFetch).mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    );

    await expect(exportMembersXlsx()).rejects.toThrow(
      "Errore nell'esportazione dei soci"
    );
  });
});
