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
}
