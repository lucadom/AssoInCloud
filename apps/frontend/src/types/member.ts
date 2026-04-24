/** Member (Socio) */
export interface Member {
  id: string;
  lastName: string;
  firstName: string;
  birthDate: string | null;
  birthPlace: string | null;
  fiscalCode: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  membershipDate: string | null;
  membershipYears: number[];
  active: boolean;
}

/** Payload for creating/updating a member */
export interface MemberFormData {
  lastName: string;
  firstName: string;
  birthDate?: string;
  birthPlace?: string;
  fiscalCode: string;
  address?: string;
  city?: string;
  phone?: string;
  membershipDate?: string;
  membershipYears?: number[];
}

/** Maps a CSV column header to a member field identifier (null = ignore the column) */
export interface CsvColumnMapping {
  csvHeader: string;
  memberField: string | null;
}

/** A single parsed row returned by the preview-csv endpoint */
export interface CsvPreviewRow {
  rowNumber: number;
  /** "new" | "update" | "skip" */
  rowStatus: "new" | "update" | "skip";
  firstName: string;
  lastName: string;
  fiscalCode: string;
  birthDate: string;
  birthPlace: string;
  address: string;
  city: string;
  phone: string;
  membershipDate: string;
}

/** Response from POST /api/members/preview-csv */
export interface CsvPreviewResponse {
  rows: CsvPreviewRow[];
  truncated: boolean;
  totalRows: number;
}

