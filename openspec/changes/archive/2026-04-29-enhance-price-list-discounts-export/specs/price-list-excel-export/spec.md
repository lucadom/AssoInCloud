## ADDED Requirements

### Requirement: Backend exposes Excel export endpoint for price list
The system SHALL expose `GET /api/price-lists/supplier/{supplierId}/export-xlsx` accepting optional `from` and `to` query parameters (ISO date strings). It SHALL execute the same price list query as the main endpoint and return an `.xlsx` file with `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `Content-Disposition: attachment; filename="listino_<supplierName>_<date>.xlsx"`.

The Excel file SHALL contain one header row followed by one data row per price list entry, with columns: Descrizione, U.M., Prezzo unitario, Sconto (%), Prezzo effettivo, Ultimo acquisto, Quantità totale.

#### Scenario: Export returns a valid XLSX file
- **WHEN** the client calls `GET /api/price-lists/supplier/{id}/export-xlsx` for a supplier with existing line items
- **THEN** the response has HTTP 200, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, and the body is a non-empty XLSX binary

#### Scenario: Export with date filter returns filtered rows
- **WHEN** the client calls the export endpoint with `?from=2024-01-01&to=2024-12-31`
- **THEN** the XLSX contains only rows whose invoices fall within the specified date range

#### Scenario: Export with no data returns XLSX with header only
- **WHEN** the client calls the export endpoint and the price list query returns no rows
- **THEN** the XLSX file contains only the header row and no data rows

### Requirement: Frontend provides Excel export button
The price list page SHALL show an "Esporta Excel" button (enabled only after a successful search). Clicking it SHALL trigger a download of the XLSX file for the currently selected supplier and date filters.

#### Scenario: Export button disabled before search
- **WHEN** no price list search has been performed yet
- **THEN** the "Esporta Excel" button is disabled

#### Scenario: Export button enabled after search with results
- **WHEN** a price list search has returned at least one result
- **THEN** the "Esporta Excel" button is enabled

#### Scenario: Export button enabled after search with no results
- **WHEN** a price list search has returned zero results
- **THEN** the "Esporta Excel" button is enabled (the empty export is valid)

#### Scenario: Clicking export downloads the file
- **WHEN** the user clicks the "Esporta Excel" button
- **THEN** the browser downloads an `.xlsx` file
