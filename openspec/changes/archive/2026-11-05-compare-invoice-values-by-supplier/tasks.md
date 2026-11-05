# Tasks

## 1. Backend invoice summaries

- [x] 1.1 Add a supplier-scoped monthly aggregation projection, service method, response DTO, and read-only invoice endpoint; add SQLite-backed tests for monthly totals, zero-filled months, and both credit-note forms, and verify them with the targeted backend test command.
- [x] 1.2 Update the API resources in `AGENTS.md` to document the new invoice comparison endpoint, and verify the endpoint and response are described accurately.

## 2. Comparison page and navigation

- [x] 2.1 Add the frontend summary type and authenticated API function, then build the initial single-supplier/year selectors and January-to-December chart with Italian loading, empty, and error states; add component/API tests for supplier changes, all-years default, year filtering, and empty data, and verify the targeted frontend tests pass.
- [x] 2.2 Group invoice navigation under "Fatture" with "Elenco" and "Confronto", preserve `page=invoices`, add the comparison route, and extend navigation tests to verify both pages and active states.
- [x] 2.3 Update the relevant feature and usage documentation in `AGENTS.md`, `README.md`, and `DEV.md`, and verify each document reflects the comparison page and no new configuration requirements.
- [x] 2.4 Change the supplier control to allow selecting multiple suppliers and display a separate chart line for each supplier/year pair; add tests for combined suppliers, labels, and available-year filtering, and verify the targeted frontend tests pass.
- [x] 2.5 Update `AGENTS.md`, `README.md`, and `DEV.md` to document multi-supplier comparisons and one line per supplier/year pair, and verify the documentation matches the revised behavior.

## 3. Integration verification

- [x] 3.1 Run `cd apps/backend && ./mvnw verify` and confirm all backend tests and the configured coverage threshold pass.
- [ ] 3.2 Run `cd apps/frontend && npm run test:coverage` and `npm run build`, confirming frontend tests, coverage, and production compilation pass.
