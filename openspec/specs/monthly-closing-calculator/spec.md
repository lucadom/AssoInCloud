# Spec: monthly-closing-calculator

## Purpose

Provides an in-memory calculator for monthly cash closing, showing the computed amounts and the arithmetic used to derive them as the user enters the closing figures.

## Requirements

### Requirement: Monthly closing inputs
The system SHALL provide a "Chiusure" page with three distinct input groups: "Incassi" for Incasso bar, Incasso tabacchi, and POS; "Spese" for Spese contanti and Spese tabacchi; and "Contanti effettivi" for the quantities of €500, €200, €100, €50, €20, €10, and €5 banknotes and the total value of Spiccioli. The Contanti effettivi group SHALL span the full width of the Incassi and Spese groups combined. Banknote quantity fields SHALL be arranged in two columns on narrow screens and four columns on desktop screens.

#### Scenario: Enter closing amounts
- **WHEN** the user opens the "Chiusure" page
- **THEN** all five Incassi and Spese amounts can be entered as non-negative euro values
- **AND** each banknote quantity can be entered as a non-negative whole number of pieces
- **AND** Spiccioli can be entered as a non-negative euro amount

#### Scenario: Empty cash denominations
- **WHEN** at least one Contanti effettivi field has a value
- **AND** other denomination or Spiccioli fields are left empty
- **THEN** empty cash fields are treated as zero

#### Scenario: Require at least one cash denomination
- **WHEN** all banknote quantity and Spiccioli fields are empty
- **THEN** the system does not display final calculations

#### Scenario: Calculate actual cash
- **WHEN** valid quantities and a valid Spiccioli total are entered
- **THEN** Contanti effettivi is calculated as the sum of each banknote denomination multiplied by its quantity plus the Spiccioli total

#### Scenario: Closing amounts are not persisted
- **WHEN** the user enters or changes any closing amount
- **THEN** the values remain only in the current page state and are not sent to an API or saved to the database

### Requirement: Live closing calculations
The system SHALL calculate and display the closing results when all five Incassi and Spese amounts are valid and at least one Contanti effettivi field has a valid value, and update the results immediately whenever an amount changes.

#### Scenario: Show the closing results
- **WHEN** all six amounts have valid values
- **THEN** the system displays Contanti teorici as Incasso bar + Incasso tabacchi - POS - Spese contanti - Spese tabacchi
- **AND** displays Differenza contanti as Contanti effettivi - Contanti teorici
- **AND** displays Incasso bar effettivo as Incasso bar + Differenza contanti
- **AND** displays Quota banconieri as 26% × Incasso bar effettivo

#### Scenario: Update results after an input changes
- **WHEN** the user changes any valid amount after all six amounts have been entered
- **THEN** all affected results are recalculated and displayed without a separate calculate action

#### Scenario: Incomplete or invalid input
- **WHEN** an Incassi or Spese amount is missing or invalid, all Contanti effettivi fields are empty, or a non-empty cash field has an invalid value
- **THEN** the system does not present partial calculations as final results

### Requirement: Explain closing calculations
The system SHALL show each result as a vertical calculation breakdown with every operand amount, its operation, and a descriptive label, followed by a visibly separated result row prefixed with an equals sign.

#### Scenario: Inspect the calculation breakdown
- **WHEN** the closing results are displayed
- **THEN** each operand is shown beside its meaning and operation in a separate row
- **AND** each operand row shows the correct mathematical operator in a distinct position before the description
- **AND** the final result is separated from the operands and prefixed by "="
- **AND** the Quota banconieri breakdown identifies the 26% rate and Incasso bar effettivo
- **AND** the Contanti effettivi breakdown shows each denomination quantity, its denomination value, and the Spiccioli total

#### Scenario: Display monetary amounts
- **WHEN** an input or result is shown
- **THEN** the amount is formatted as euro currency with two decimal places

#### Scenario: Visually distinguish amounts from descriptions
- **WHEN** the user reads a calculation breakdown
- **THEN** operand and result amounts are emphasized in dark text
- **AND** operand descriptions are shown in muted text

### Requirement: Available banknote payout
The system SHALL show a final "Banconote da dare ai banconieri" box based on the entered banknote inventory. The payout target SHALL be Quota banconieri rounded to the nearest multiple of 5 euros, with a half-step rounded upward. The unrounded Quota banconieri calculation SHALL remain unchanged. Only entered banknotes SHALL be used; Spiccioli SHALL NOT be used to compose the payout.

#### Scenario: Round the payout target
- **WHEN** Quota banconieri is 102.49 euros
- **THEN** the payout target is 100.00 euros
- **WHEN** Quota banconieri is 102.50 euros
- **THEN** the payout target is 105.00 euros

#### Scenario: Allocate available banknotes
- **WHEN** the rounded target can be composed from entered banknotes
- **THEN** the box shows the number of pieces for every denomination and the total to hand over
- **AND** no selected quantity exceeds the entered quantity
- **AND** the total equals the rounded target
- **AND** the selection prefers larger denominations, maximizing their quantities in descending denomination order while preserving an exact allocation

#### Scenario: Retry smaller denominations when required
- **WHEN** a target of 60 euros is to be composed with one 50-euro banknote and three 20-euro banknotes only
- **THEN** three 20-euro banknotes are proposed instead of reporting failure after selecting the 50-euro banknote

#### Scenario: Uncomposable payout
- **WHEN** the rounded target cannot be composed with the entered banknotes
- **THEN** the box shows "Totale non componibile"
- **AND** no incomplete allocation or higher payout is proposed
- **AND** if the available banknote value covers the target, the box suggests a value-preserving denomination exchange and an exact allocation to use after that exchange
- **AND** if banknote funds are insufficient, it explains that exchanging denominations cannot solve the shortfall

#### Scenario: Suggested denomination exchange
- **WHEN** an exchange is needed to compose the payout
- **THEN** the box identifies an available banknote to exchange and the counts of smaller banknotes to receive
- **AND** the received banknotes have exactly the same total value as the exchanged banknote
- **AND** the proposed post-exchange payout uses only the updated hypothetical inventory and still prefers larger denominations
- **AND** the box explicitly states the exchange must be obtained before handing over the banknotes and does not modify the entered inventory

#### Scenario: Zero or negative quota
- **WHEN** a non-negative quota rounds to zero
- **THEN** the box proposes zero pieces of every denomination and a zero total
- **WHEN** Quota banconieri is negative
- **THEN** the box explains that a negative quota cannot be paid out in banknotes

#### Scenario: Live payout changes
- **WHEN** any income, expense, banknote quantity, or Spiccioli amount changes
- **THEN** the payout target and allocation update together with the other closing results
