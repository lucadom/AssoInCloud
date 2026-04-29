# Spec: membership-renewal-management

## Purpose
Defines current-year membership renewal behavior, validation/no-op semantics, updated API responses, frontend renewal actions, active-member filtering, and active-member export.

## Requirements

### Requirement: The system SHALL provide an explicit current-year renewal operation
The system SHALL expose a renewal operation that records membership for the current calendar year for a member.

#### Scenario: Successful renewal adds current year
- **WHEN** a client triggers renewal for a member who does not yet have the current year
- **THEN** the system SHALL record the current year in that member membership years

#### Scenario: Renewal allowed regardless of how many years were missed
- **WHEN** a member has a multi-year gap since last recorded membership year
- **THEN** renewal SHALL still succeed by recording the current year without requiring backfill of missed years

### Requirement: Renewal operation SHALL enforce year-history validation rules
The system SHALL reject renewal actions that violate membership-year invariants.

#### Scenario: Reject renewal for unknown member
- **WHEN** a client triggers renewal for a non-existent member identifier
- **THEN** the system SHALL return a not-found error and SHALL not modify any data

#### Scenario: Ignore duplicate current-year renewal
- **WHEN** a client triggers renewal for a member who already has the current year recorded
- **THEN** the system SHALL not create a duplicate year record and SHALL return a consistent success or no-op response

### Requirement: Renewal-focused API responses SHALL support UI workflow needs
The system SHALL return updated membership years and derived status after renewal actions so clients can immediately refresh UI state.

#### Scenario: Renewal response includes updated membership years
- **WHEN** a renewal operation succeeds
- **THEN** the response SHALL include updated membership years and status for the renewed member

#### Scenario: Renewal errors are user-displayable
- **WHEN** a renewal operation fails due to validation or business constraints
- **THEN** the API response SHALL include an error message suitable for frontend display and logging

### Requirement: Frontend SHALL provide renewal action and active-member filtering/export
The user interface SHALL allow operators to execute renewals, filter members by active status, and export active members.

#### Scenario: Operator renews a member from list view
- **WHEN** an operator selects the renewal action on a member entry
- **THEN** the UI SHALL call the renewal operation and refresh the member row with updated status and membership years

#### Scenario: Operator filters active members
- **WHEN** an operator applies the active status filter
- **THEN** the UI SHALL display only members that are active for the current year

#### Scenario: Operator exports active members
- **WHEN** an operator triggers export while active status filter is applied
- **THEN** the exported dataset SHALL contain only active members
