## 1. Monthly closing page

- [x] 1.1 Add a client-side "Chiusure" page with controlled non-negative euro inputs for Incassi and Spese, keeping values in page state only; verify its page tests confirm all fields are editable and no API or persistence is used.
- [x] 1.2 Implement the four derived amounts using integer cents, round the 26% component to cents, and show formula breakdowns with substituted amounts and EUR formatting; verify page tests cover expected calculations, updates, incomplete values, signed cash differences, and rounding.
- [x] 1.3 Show each calculation as labeled operand rows with emphasized amounts and muted descriptions, followed by a separated result; verify page tests cover the displayed input names, operators, percentage rate, and totals.
- [x] 1.4 Group the five income/expense fields and eight cash fields into Incassi, Spese, and Contanti effettivi boxes; verify each group and field appears in page tests.
- [x] 1.5 Calculate actual cash from integer banknote counts and Spiccioli, treating empty cash fields as zero while requiring at least one entered value; verify mixed denominations, coins, empty fields, and invalid counts through page tests.
- [x] 1.6 Let Contanti effettivi span the combined Incassi and Spese width, use two narrow-screen and four desktop denomination columns, and make calculation operators explicit/aligned with "=" on each result row; verify the input grid and all operand operators through page tests.
- [x] 1.7 Add nearest-five-euro rounding and exact banknote allocation preferring larger available denominations; verify rounding boundaries, inventory limits, backtracking, zero targets, and uncomposable totals with unit tests.
- [x] 1.8 Show the final payout box with the original quota, rounded target, all denomination counts and exact total or an explicit warning; verify live updates, coins exclusion and negative quota handling in page tests.
- [x] 1.9 Suggest a value-preserving denomination exchange and post-exchange allocation when funds suffice but current denominations cannot compose the quota; verify denomination totals, inventory conservation, unchanged inputs, and insufficient-funds handling.

## 2. Navigation integration

- [x] 2.1 Register the `closing` page key, render the page, and add "Chiusure" immediately before "Impostazioni"; verify AppLayout tests cover URL selection, menu order, and active state.

## 3. Documentation and validation

- [x] 3.1 Update the relevant feature documentation to describe the non-persistent monthly closing calculator; verify the feature summary accurately reflects the page and its formulas.
- [x] 3.2 Run backend verification, frontend coverage, and frontend build (`cd apps/backend && ./mvnw verify`, `cd apps/frontend && npm run test:coverage`, and `cd apps/frontend && npm run build`) and confirm all commands succeed.
- [x] 3.3 Update payout documentation and validate the allocation change with frontend coverage, frontend build, backend verification, and strict OpenSpec validation; record any unmet pre-existing coverage thresholds.

Validation note: all frontend tests, the frontend production build, backend verification, and strict OpenSpec validation passed. Frontend line coverage is 73.75%; branch coverage is 66.69%, above the earlier 64.81% but still below the repository's 70% goal.
