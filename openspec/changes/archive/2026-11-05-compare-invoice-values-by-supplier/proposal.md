# Proposal

## Why

Users can review invoices but cannot readily compare how spending with suppliers changes month by month across years. Comparing multiple suppliers together will make seasonal patterns and differences in supplier costs easier to see.

## What Changes

- Add an invoice comparison page with a multi-select supplier control and a monthly chart from January through December.
- Show one line for each supplier/year combination with data, using a distinct supplier-and-year label; allow multi-select year filtering across the selected suppliers.
- Aggregate invoice totals including VAT by invoice date and supplier; subtract credit notes from the monthly totals.
- Group the invoice navigation in the sidebar under "Fatture", with "Elenco" for the current invoice list and "Confronto" for the new page.

## Capabilities

### New Capabilities
- `invoice-value-comparison`: Compare supplier invoice totals by month across selected years.

### Modified Capabilities
- `app-navigation`: Group the existing invoice-list entry and new comparison page under "Fatture".

## Impact

- Frontend navigation, invoice pages, API client/types, and chart UI.
- Backend invoice aggregation query/service/controller and response DTO.
- Backend and frontend tests and project feature/navigation documentation.
