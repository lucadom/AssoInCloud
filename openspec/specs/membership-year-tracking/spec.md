# Spec: membership-year-tracking

## Purpose
Defines yearly membership participation records, calendar-year validity, derived active/inactive status, and deterministic migration backfill behavior.

## Requirements

### Requirement: Membership SHALL be modeled as yearly participation records
The system SHALL track membership as explicit calendar years per member (for example 2022, 2023, 2026).

#### Scenario: Store non-contiguous membership years
- **WHEN** a member was active in some years and inactive in others
- **THEN** the system SHALL preserve only the paid membership years and SHALL allow gaps in the sequence

#### Scenario: Return membership years for member details
- **WHEN** a client requests member details
- **THEN** the response SHALL include the list of membership years recorded for that member

### Requirement: Membership year validity SHALL follow calendar-year boundaries
The system SHALL treat each membership year as valid from January 1 through December 31 of that same year.

#### Scenario: Current-year membership validity window
- **WHEN** a membership year equals the current calendar year
- **THEN** that membership SHALL be considered valid for the entire current year

#### Scenario: Prior-year membership is not current membership
- **WHEN** the latest membership year for a member is less than the current year
- **THEN** the member SHALL not be considered active for the current year

### Requirement: Member status SHALL be derived as active or inactive only
The system SHALL derive member status with exactly two values: active and inactive.

#### Scenario: Active member status
- **WHEN** the member has the current year in membership years
- **THEN** the member status SHALL be active

#### Scenario: Inactive member status
- **WHEN** the member does not have the current year in membership years
- **THEN** the member status SHALL be inactive

### Requirement: Existing members SHALL receive deterministic year data during migration
The system SHALL backfill membership years for pre-existing members during migration using a documented deterministic rule.

#### Scenario: Backfill from existing membership acceptance year
- **WHEN** an existing member has a usable membership acceptance date
- **THEN** the system SHALL initialize membership years including the corresponding acceptance year

#### Scenario: Backfill fallback for missing acceptance date
- **WHEN** an existing member lacks usable date data for backfill
- **THEN** the system SHALL apply the fallback rule and SHALL not fail migration
