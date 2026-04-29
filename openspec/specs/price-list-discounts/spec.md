# Spec: price-list-discounts

## Purpose
Defines supplier price list discount handling, effective-price calculation, discount-aware grouping, and frontend presentation.

## Requirements

### Requirement: Price list rows include discount percentage and effective price
The system SHALL include `discountPercentage` and `effectiveUnitPrice` in every `PriceListItemDto` returned by `GET /api/price-lists/supplier/{id}`.

`effectiveUnitPrice` SHALL be computed as `unitPrice × (1 − discountPercentage / 100)`, rounded to 4 decimal places. When `discountPercentage` is NULL or zero, `effectiveUnitPrice` SHALL equal `unitPrice`.

#### Scenario: Line item with discount returns effective price
- **WHEN** a line item has `unitPrice = 10.00` and `discountPercentage = 20`
- **THEN** the API returns `effectiveUnitPrice = 8.0000` and `discountPercentage = 20`

#### Scenario: Line item without discount returns unit price as effective price
- **WHEN** a line item has `unitPrice = 10.00` and `discountPercentage = NULL`
- **THEN** the API returns `effectiveUnitPrice = 10.0000` and `discountPercentage = null`

#### Scenario: Line item with zero discount returns unit price as effective price
- **WHEN** a line item has `unitPrice = 10.00` and `discountPercentage = 0`
- **THEN** the API returns `effectiveUnitPrice = 10.0000` and `discountPercentage = 0`

### Requirement: Price list rows are distinct by discount percentage
The system SHALL group price list rows by `(description, unit_of_measure, unit_price, discount_percentage)`. Two purchases of the same product at the same unit price but with different discount percentages SHALL appear as separate rows.

#### Scenario: Same product, different discounts → two rows
- **WHEN** a supplier has two invoices for the same product at the same unit price but with discounts of 10% and 20% respectively
- **THEN** the price list returns two separate rows, one with `discountPercentage = 10` and one with `discountPercentage = 20`

#### Scenario: Same product, same discount → one row
- **WHEN** a supplier has two invoices for the same product at the same unit price and the same discount percentage
- **THEN** the price list returns one row with the combined quantity and the latest purchase date

#### Scenario: Same product, one with null discount and one with zero discount → separate rows
- **WHEN** a supplier has one invoice line with `discount_percentage = NULL` and another with `discount_percentage = 0` for the same product at the same unit price
- **THEN** the price list returns two separate rows

### Requirement: Frontend displays discount and effective price columns
The price list page SHALL show two additional columns: "Sconto (%)" displaying the discount percentage (or "—" if null) and "Prezzo effettivo" displaying `effectiveUnitPrice` formatted as currency.

#### Scenario: Discount column shows formatted percentage
- **WHEN** a price list row has `discountPercentage = 15`
- **THEN** the "Sconto (%)" cell displays "15%"

#### Scenario: Discount column shows dash for null discount
- **WHEN** a price list row has `discountPercentage = null`
- **THEN** the "Sconto (%)" cell displays "—"

#### Scenario: Effective price column shows formatted currency
- **WHEN** a price list row has `effectiveUnitPrice = 8.5`
- **THEN** the "Prezzo effettivo" cell displays the value formatted as EUR currency
