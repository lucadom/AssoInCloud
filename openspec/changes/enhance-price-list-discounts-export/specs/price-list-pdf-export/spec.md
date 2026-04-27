## ADDED Requirements

### Requirement: Backend exposes PDF export endpoint for price list
The system SHALL expose `GET /api/price-lists/supplier/{supplierId}/export-pdf` accepting optional `from` and `to` query parameters (ISO date strings). It SHALL execute the same price list query as the main endpoint and return a PDF file with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="listino_<supplierName>_<date>.pdf"`.

The PDF SHALL contain:
1. A header section with: supplier name, supplier VAT number, and the date range of the query (or "Tutte le date" if no filter applied).
2. A table with columns: Descrizione, U.M., Prezzo unitario, Sconto (%), Prezzo effettivo, Ultimo acquisto, Quantità totale.
3. One data row per price list entry.

#### Scenario: PDF export returns a valid PDF
- **WHEN** the client calls `GET /api/price-lists/supplier/{id}/export-pdf` for a supplier with existing line items
- **THEN** the response has HTTP 200, `Content-Type: application/pdf`, and the body starts with the PDF magic bytes `%PDF`

#### Scenario: PDF header contains supplier name and VAT number
- **WHEN** the PDF is generated for a supplier with name "Fornitore SRL" and VAT number "IT12345678901"
- **THEN** the PDF document contains the text "Fornitore SRL" and "IT12345678901" in the header section

#### Scenario: PDF header contains the date range
- **WHEN** the PDF is generated with `?from=2024-01-01&to=2024-12-31`
- **THEN** the PDF header section contains the text "01/01/2024" and "31/12/2024"

#### Scenario: PDF header shows "Tutte le date" when no filter is applied
- **WHEN** the PDF is generated with no `from` or `to` parameters
- **THEN** the PDF header section contains the text "Tutte le date"

#### Scenario: PDF with no data shows empty table
- **WHEN** the price list query returns no rows
- **THEN** the PDF contains the header section and a table with column headers but no data rows

### Requirement: Frontend provides PDF export button
The price list page SHALL show a "Esporta PDF" button (enabled only after a successful search). Clicking it SHALL trigger a download of the PDF file for the currently selected supplier and date filters.

#### Scenario: PDF export button disabled before search
- **WHEN** no price list search has been performed yet
- **THEN** the "Esporta PDF" button is disabled

#### Scenario: PDF export button enabled after search
- **WHEN** a price list search has been performed (regardless of result count)
- **THEN** the "Esporta PDF" button is enabled

#### Scenario: Clicking PDF export downloads the file
- **WHEN** the user clicks the "Esporta PDF" button
- **THEN** the browser downloads a `.pdf` file
