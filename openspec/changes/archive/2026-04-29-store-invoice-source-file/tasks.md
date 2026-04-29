## 1. Backend persistence

- [x] 1.1 Add a Flyway migration for an `invoice_source_files` table with a one-to-one `invoice_id` foreign key, original filename, content type, and BLOB data.
- [x] 1.2 Add an `InvoiceSourceFile` entity and repository with cascade deletion from invoices.
- [x] 1.3 Wire invoice source-file metadata into `Invoice` and `InvoiceDto` without including binary content in normal invoice responses.

## 2. Backend import and download behavior

- [x] 2.1 Update XML/P7M invoice imports to retain the original uploaded bytes and filename from the invoices upload flow.
- [x] 2.2 Update PEC invoice imports to retain the original attachment bytes and filename through the shared import service path.
- [x] 2.3 Replace the retained source file when a duplicate XML/P7M import updates an existing invoice.
- [x] 2.4 Add a `GET /api/invoices/{invoiceId}/source-file` endpoint that returns the original file as an attachment and reports missing files with an Italian not-found error.
- [x] 2.5 Ensure manual invoice creation and CSV imports continue to create invoices without source-file metadata.

## 3. Frontend integration

- [x] 3.1 Extend invoice TypeScript types and API helpers with source-file availability metadata and a download URL helper.
- [x] 3.2 Add an Italian download action in invoice details that appears only when a source file is available.
- [x] 3.3 Keep existing embedded invoice attachment preview/download behavior separate from source-file download.

## 4. Tests and documentation

- [x] 4.1 Add backend tests for XML upload retention, PEC/shared byte import retention, duplicate import replacement, source-file download integrity, and missing source-file behavior.
- [x] 4.2 Add or update frontend tests for source-file metadata rendering and download action visibility.
- [x] 4.3 Update relevant project documentation and OpenSpec references for the new invoice source-file retention behavior.
- [x] 4.4 Run backend verification, frontend coverage, and frontend build commands required by the project workflow.
