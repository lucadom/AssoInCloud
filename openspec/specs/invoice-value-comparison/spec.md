# invoice-value-comparison Specification

## Purpose

Enables users to compare multiple suppliers' invoice totals across calendar years, making monthly spending patterns and year-over-year differences visible.

## Requirements

### Requirement: Compare monthly invoice totals for selected suppliers
The system SHALL display a January-to-December chart with one line for each selected supplier/year combination containing invoice data, using invoice dates and totals including VAT.

#### Scenario: Display monthly values for multiple suppliers
- **WHEN** the user selects multiple suppliers with invoices
- **THEN** the chart shows one line per supplier/year combination and labels each line with its supplier and year

#### Scenario: Compare a single supplier
- **WHEN** the user selects one supplier with invoices
- **THEN** the chart shows that supplier's monthly totals as a separate line for each year with invoices

#### Scenario: Months without invoices
- **WHEN** a selected supplier has no invoices in a month of a year with invoices
- **THEN** that month is represented as zero on that supplier/year line

#### Scenario: Subtract credit notes
- **WHEN** a selected supplier has a credit note in a month
- **THEN** the credit note's total amount is subtracted from that supplier's monthly invoice total

### Requirement: Select years to compare
The system SHALL let the user choose any combination of years available for the selected suppliers, and SHALL show all such years by default.

#### Scenario: Compare a subset of years
- **WHEN** the user selects two or more available years
- **THEN** the chart shows each selected supplier/year line and no lines for unselected years

#### Scenario: Show all available years by default
- **WHEN** the user selects or changes the set of suppliers
- **THEN** all years with invoices for any selected supplier are selected and all matching supplier/year lines are displayed

#### Scenario: No selected supplier has invoices
- **WHEN** the user selects one or more suppliers and none has invoices
- **THEN** the chart shows an Italian-language empty state and no year options are available
