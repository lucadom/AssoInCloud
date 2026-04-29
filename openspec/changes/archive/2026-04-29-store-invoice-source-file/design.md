## Context

Electronic invoice imports currently parse XML/P7M files into invoice records, line items, and embedded FatturaPA attachments. The uploaded source file itself is not retained, so after import the system cannot provide the original XML/P7M document back to the user. The same import service is used by direct invoice uploads and PEC attachment imports, while manual invoice creation and CSV import create invoice data without an original source file.

## Goals / Non-Goals

**Goals:**
- Preserve the exact uploaded XML/P7M bytes and original filename for invoices imported from the invoices page.
- Preserve the exact PEC attachment bytes and filename when importing a PEC attachment as an invoice.
- Expose source-file availability in invoice API responses and add a download endpoint returning the original content unchanged.
- Keep manual and CSV-created invoices valid without a source file.
- Replace the stored source file when an existing invoice is updated by re-importing an XML/P7M file under the existing duplicate/upsert rule.

**Non-Goals:**
- Retroactively reconstruct source files for existing invoices.
- Store or generate source files for manual invoices or CSV imports.
- Change FatturaPA embedded attachment handling; those attachments remain separate from the invoice source file.
- Add source-file preview or editing.

## Decisions

- Store source files in a dedicated one-to-one table such as `invoice_source_files` with `invoice_id`, `file_name`, `content_type`, and `data` columns. This keeps binary data separate from the main `invoices` table, preserves cascade deletion, and avoids confusing source files with existing FatturaPA attachments. An inline BLOB on `invoices` was rejected because list/detail invoice queries should not need to load large binary content.
- Add an `InvoiceSourceFile` entity and repository rather than reusing `InvoiceAttachment`. FatturaPA attachments are business attachments extracted from the XML, while the source file is the import artifact; separating them avoids UI/API ambiguity and supports exactly one source file per invoice.
- Capture source-file bytes before parsing. For P7M files, parsing will continue to extract XML bytes for `FatturaElettronicaParser`, but storage will use the original P7M bytes and original filename. This guarantees download integrity for both XML and signed P7M imports.
- Extend `InvoiceService.importXmlFromBytes(byte[] bytes, String filename)` to save or replace the source file after parsing and before returning the import result. Because PEC imports already call this method with attachment bytes and filename, both supported import paths share the same retention behavior.
- Add DTO metadata fields, for example `sourceFileName` and `sourceFileAvailable`, to `InvoiceDto`. The list/detail responses can then render a download action without exposing binary data.
- Add `GET /api/invoices/{invoiceId}/source-file` returning the binary source file with `Content-Disposition: attachment` and the stored filename. Missing source files should return a clear not-found response with an Italian user-facing error message.
- Add a frontend API helper for the source-file download URL and display a download action in invoice details only when `sourceFileAvailable` is true.

## Risks / Trade-offs

- Larger SQLite database size from storing original XML/P7M BLOBs -> Store the BLOB in a separate table and avoid including it in normal invoice DTOs.
- Existing invoices will not have source files -> Treat absence as normal and show no download action.
- Duplicate imports may overwrite a previously stored source file -> This matches the existing import behavior that updates invoice data when the same supplier VAT number and invoice number are imported again.
- Incorrect content type detection could affect browser behavior -> Persist a best-effort content type, but use attachment disposition and rely on the original filename extension for download.

## Migration Plan

Create a new Flyway migration for the source-file table with a unique foreign key to `invoices(id)` and `ON DELETE CASCADE`. No data backfill is required. Rollback, if needed, can drop the new table and remove the API/UI code; existing invoice records remain intact.

## Open Questions

- None.
