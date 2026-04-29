## Why

Imported electronic invoices currently populate invoice data but discard the uploaded XML/P7M source file. Keeping the original file is needed so users can later download the exact document that was imported, preserving its original filename and unchanged contents for audit and operational use.

## What Changes

- Store the original uploaded invoice source file when importing invoices from the invoices page.
- Store the original invoice source file when importing invoices from PEC attachments.
- Allow users to download the stored source file using its original filename and unaltered content.
- Represent invoices imported manually or from CSV as having no source file.
- Preserve existing invoice data import behavior and duplicate/upsert rules.

## Capabilities

### New Capabilities
- `invoice-source-file-retention`: Retention and download of original XML/P7M invoice source files for supported import paths.

### Modified Capabilities

## Impact

- Backend invoice import services, entities, repositories, DTOs, and REST endpoints.
- PEC invoice import flow where invoice attachments are processed.
- Database schema for storing source-file metadata and binary content or a durable file reference.
- Frontend invoice UI and API client functions for exposing download availability and retrieving the stored source file.
- Tests for invoice-page import, PEC import, CSV/manual invoices without files, and source-file download integrity.
