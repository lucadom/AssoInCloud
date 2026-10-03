## Context

See `proposal.md` for the motivation and scope. The frontend is a client-rendered page selected by `AppLayout` through the `page` query parameter. The new calculator has no server-side data or persistence requirements.

## Goals / Non-Goals

**Goals:**
- Keep the Incassi and Spese values, denomination quantities, and derived values local to the page.
- Make the formulas visible alongside the monetary results.
- Reuse the existing app shell and component library conventions.

**Non-Goals:**
- Persisting a closing, restoring values after navigation, or adding a backend endpoint.
- Adding monthly history, exports, or a configurable commission rate.

## Decisions

- **Implement a dedicated frontend page and register it in `AppLayout`.** Add a `closing` page key to the valid page values and render its component from the main content area. Add the "Chiusure" navigation entry directly before "Impostazioni", so the URL can address the page and the active navigation state follows existing behavior. This uses the existing single-page navigation instead of introducing a route or navigation mechanism.
- **Keep inputs in component state and calculate derived values from them.** Group the controlled inputs into Incassi, Spese, and Contanti effettivi boxes. Require valid non-negative euro amounts for the five Incassi/Spese fields. Parse banknote fields as non-negative whole-number piece counts, multiply each by its denomination, and add the Spiccioli amount. Empty cash fields contribute zero, but at least one cash field must be non-empty. Recompute on every valid input change, with no calculate button.
- **Use exact cent amounts for arithmetic and format display as EUR.** Parse entered amounts into integer cents, calculate amounts in cents, and round the 26% of Incasso bar effettivo to the nearest cent. Incasso tabacchi and POS do not contribute to Quota banconieri. Format input values and results with two decimal places in euro currency, while retaining the signed value for Differenza contanti when cash is over or short.
- **Show labeled operand rows.** Present each formula as a vertical list of amounts, operators, and muted descriptive labels. Keep operator columns aligned and visible, use the correct operator for each operand, and prefix the separated result row with "=". Show the commission rate as a named operand for Quota banconieri.
- **Arrange cash denominations compactly.** Let the Contanti effettivi box span the full width of the Incassi and Spese boxes combined. Display the seven banknote quantity inputs in two columns on narrow screens and four on desktop, with the Spiccioli total below them.
- **Allocate only the available banknotes to the rounded quota.** Keep the original quota unchanged and derive a payout target rounded to the nearest 500 cents, with the halfway point rounded upward. Use integer arithmetic and a bounded descending-denomination search, trying the largest feasible count first and backtracking when necessary. A purely greedy algorithm is insufficient: 60 euros can require three 20-euro notes rather than a 50-euro note. Prune branches whose remaining inventory cannot cover the target. Display all seven allocated counts and the exact total, or an explicit uncomposable-total warning without a partial proposal. Spiccioli affect the quota through actual cash but are not available for banknote distribution. A negative quota shows a warning; a non-negative quota rounded to zero produces zero counts.
- **Add frontend coverage for calculations and navigation.** Test the equations and rounding/negative-difference cases at the page level, and verify the new menu placement, URL key, rendering, and active state through the existing `AppLayout` test suite.

## Risks / Trade-offs

- [Inputs may be incomplete or malformed while the user is typing] → Keep the result section in an incomplete state until all six values are valid, and validate each input without treating invalid text as zero.
- [Binary floating-point can create cent-level discrepancies] → Convert valid input to integer cents before performing calculations and round the percentage component once to cents.
- [Largest-first selection can leave an impossible remainder] → Backtrack across available counts to find an exact allocation before declaring the target uncomposable.

### Denomination exchange suggestion

When exact allocation fails but the total banknote value covers the rounded quota, suggest exchanging one available note from the largest available denomination. Remove that note from a hypothetical inventory and greedily take existing notes toward the payout. Split the removed note into smaller denominations that cover both the outstanding payout remainder and the change left over; the exchange therefore preserves value and guarantees an exact multiple-of-five payout. Run the exact allocation against the hypothetical inventory again to retain the largest-first preference. Display the exchange and the post-exchange allocation separately from actual inventory; do not mutate the input fields or use coins. If banknote funds are insufficient or the quota is negative, display the explicit warning without suggesting an exchange.

## Migration Plan

No data migration or backend deployment is needed. Deploy the frontend with the new page; rollback consists of reverting the frontend change because no persisted data or API contract is introduced.
