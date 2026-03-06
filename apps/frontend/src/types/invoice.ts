/** Supplier (Fornitore) */
export interface Supplier {
  id: string;
  name: string;       // Denominazione fornitore
  vatNumber: string;   // Identificativo Fornitore (Partita IVA) - unique
  invoiceCount: number; // Number of associated invoices
  paymentMethod?: string | null; // Modalità di pagamento
}

/** Payload for creating/updating a supplier */
export interface SupplierFormData {
  name: string;
  vatNumber: string;
  paymentMethod?: string | null;
}

/** Invoice line item (DettaglioLinee from FatturaPA XML) */
export interface InvoiceLineItem {
  id: string;
  lineNumber: number;
  description: string;
  quantity: number | null;
  unitOfMeasure: string | null;
  unitPrice: number | null;
  totalPrice: number | null;
  vatRate: number | null;
  articleCode: string | null;
  articleCodeType: string | null;
  eanCode: string | null;
  discountType: string | null;
  discountPercentage: number | null;
}

/** Invoice attachment metadata (no binary data) */
export interface InvoiceAttachment {
  id: string;
  fileName: string;
  contentType: string;
}

/** Invoice (Fattura) */
export interface Invoice {
  id: string;
  documentType: string;    // Tipo documento (e.g. "TD24")
  documentTypeDescription: string; // Descrizione tipo documento (e.g. "Fattura differita...")
  creditNote: boolean;     // True if TD04 / Nota di credito
  invoiceNumber: string;   // Numero fattura / Documento
  date: string;            // Data emissione fattura (ISO date string)
  supplier: Supplier;
  taxableAmount: number;   // Imponibile / Importo
  taxAmount: number;       // Imposta (totale in euro)
  totalAmount: number;     // taxableAmount + taxAmount
  sdiNumber: string;       // Sdi/file
  viewed: boolean;         // Fatture visualizzate
  fileName?: string;
  // XML-specific fields
  currency?: string;
  causale?: string;
  paymentMethod?: string;
  paymentDueDate?: string;
  paymentAmount?: number;
  iban?: string;
  supplierFiscalCode?: string;
  supplierAddress?: string;
  supplierCap?: string;
  supplierCity?: string;
  supplierProvince?: string;
  lineItems: InvoiceLineItem[];
  attachments: InvoiceAttachment[];
}

/** Payload for creating/updating an invoice */
export interface InvoiceFormData {
  documentType: string;
  invoiceNumber: string;
  date: string;
  supplierName: string;
  supplierVatNumber: string;
  taxableAmount: number;
  taxAmount: number;
  sdiNumber: string;
  viewed: boolean;
}

/** Result of a CSV or XML invoice import operation */
export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
}

/** Product search result from invoice line items */
export interface ProductSearchResult {
  lineItemId: string;
  supplierName: string;
  invoiceDate: string;
  description: string;
  quantity: number | null;
  unitOfMeasure: string | null;
  unitPrice: number | null;
  totalPrice: number | null;
}

/** Price list entry: one row per (description, unitPrice) combination */
export interface PriceListItem {
  description: string;
  unitOfMeasure: string | null;
  unitPrice: number | null;
  lastPurchaseDate: string;
  totalQuantity: number | null;
}
