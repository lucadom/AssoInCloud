# Design

## Context

See proposal.md for the motivation and specs for observable behavior. The frontend currently routes pages with the `page` query parameter and renders them from `AppLayout`; it already fetches suppliers and invoices through authenticated API clients. Invoices store a date, `totalAmount`, and document type, while `DocumentTypeUtil` recognizes TD04 and the Italian credit-note label. The frontend already depends on Mantine Charts/Recharts, and the database is SQLite.

## Goals / Non-Goals

**Goals:**
- Keep aggregation server-side and return only monthly summary data for each selected supplier.
- Reuse existing supplier loading, authenticated API patterns, chart dependencies, and navigation conventions.
- Preserve the existing invoice-list URL while adding a distinct URL value for comparison.

**Non-Goals:**
- Add invoice amount modes, date-range controls, exports, or persistence.
- Change invoice entry/import semantics or add a database migration.

## Decisions

- **Reuse the supplier-scoped invoice summary endpoint for multiple suppliers.** The read-only endpoint under `/api/invoices` accepts one supplier ID and returns year, month, and signed monthly total rows. The frontend requests summaries for the selected supplier IDs in parallel, then combines them into a distinct series for each supplier/year pair. This avoids fetching full invoice DTOs and their line items/attachments just to build a chart. The frontend fills missing months with zero and filters years locally.
- **Aggregate in SQLite.** Use a repository projection grouped by SQLite `strftime` year/month and sum `total_amount`; apply a negative sign to document types recognized as credit notes (TD04 or the existing Italian label). This keeps work and response size proportional to the number of populated supplier-months. Java-side aggregation was considered but would load every matching invoice into the service.
- **Reuse existing frontend libraries and API patterns.** Load suppliers with the current suppliers API client, use a supplier multi-select, fetch summary rows for each selected supplier, and render supplier/year series using the existing Mantine Charts dependency. On supplier-set changes, select all years available among those suppliers. Keep the empty, loading, and error states in Italian and use shared logging conventions.
- **Extend the existing navigation and URL routing.** Nest "Elenco" and "Confronto" under "Fatture". Keep `page=invoices` for the existing list and add a separate `page` value for comparison, so existing links continue to work.
- **Select all supplier years initially.** Derive the available years from all selected suppliers' summary data, initially select all of them, and update displayed supplier/year lines when the user changes the year multi-select.

## Risks / Trade-offs

- [SQLite-specific date grouping] → The query relies on SQLite `strftime`; keep an integration test against the project's in-memory SQLite configuration.
- [Credit-note classification could drift from application rules] → Cover both recognized document-type forms in aggregation tests and keep the query predicate aligned with `DocumentTypeUtil`.
- [Many supplier/year combinations can make the chart crowded] → Allow users to narrow the chart with the year multi-select; do not cap suppliers or available years.

## Migration Plan

No schema migration is required. Deploy the backend endpoint and frontend together. Rollback consists of reverting the endpoint and comparison UI/navigation changes; persisted invoice data is unaffected.
