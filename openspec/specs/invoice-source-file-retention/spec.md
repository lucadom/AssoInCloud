# Spec: invoice-source-file-retention

## Purpose
Define retention and download behavior for original invoice source files imported from XML, P7M, and PEC attachments while preserving support for invoices without retained source files.

## Requirements

### Requirement: Source file is retained for XML and P7M invoice uploads
The system SHALL store the original source file bytes and original filename when an invoice is imported from an XML or P7M file through the invoices upload flow.

#### Scenario: XML invoice uploaded from invoices page
- **WHEN** a user imports an XML invoice file from the invoices page
- **THEN** the system stores the exact uploaded XML content and original filename with the imported invoice

#### Scenario: P7M invoice uploaded from invoices page
- **WHEN** a user imports a P7M invoice file from the invoices page
- **THEN** the system stores the exact uploaded P7M content and original filename with the imported invoice

### Requirement: Source file is retained for PEC invoice imports
The system SHALL store the original PEC attachment bytes and attachment filename when a PEC attachment is imported as an invoice.

#### Scenario: PEC XML attachment imported as invoice
- **WHEN** a user imports a PEC XML attachment as an invoice
- **THEN** the system stores the exact attachment content and attachment filename with the imported invoice

#### Scenario: PEC P7M attachment imported as invoice
- **WHEN** a user imports a PEC P7M attachment as an invoice
- **THEN** the system stores the exact attachment content and attachment filename with the imported invoice

### Requirement: Source file can be downloaded unchanged
The system SHALL allow users to download a retained invoice source file with its original filename and unmodified content.

#### Scenario: Download retained source file
- **WHEN** a user downloads the source file for an invoice that has one
- **THEN** the response uses the stored original filename and returns bytes identical to the imported source file

#### Scenario: Source file missing
- **WHEN** a user requests the source file for an invoice that does not have one
- **THEN** the system returns a not-found response with an Italian error message

### Requirement: Invoices without source files remain supported
The system SHALL support invoices created manually or imported from CSV without requiring a source file.

#### Scenario: Manual invoice has no source file
- **WHEN** a user creates an invoice manually
- **THEN** the invoice is saved without source-file metadata and no source-file download is offered

#### Scenario: CSV import has no source file
- **WHEN** a user imports invoices from CSV
- **THEN** the imported invoices are saved without source-file metadata and no source-file download is offered

### Requirement: Re-import replaces retained source file
The system SHALL replace the retained source file when an XML or P7M import updates an existing invoice under the supplier VAT number and invoice number matching rule.

#### Scenario: Duplicate XML or P7M import updates existing invoice
- **WHEN** an XML or P7M import matches an existing invoice by supplier VAT number and invoice number
- **THEN** the system updates the invoice data and replaces the retained source file with the newly imported original file bytes and filename
