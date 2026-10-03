# Spec: app-navigation

## Purpose
Defines the main navigation entries that expose the Documents page and monthly closing calculator to users.

## Requirements

### Requirement: Documents navigation entry
The application navigation SHALL include a "Documenti" entry that navigates the user to the Documents page. It SHALL also include a "Chiusure" entry immediately before "Impostazioni", which navigates to the monthly closing calculator and is highlighted while that page is active.

#### Scenario: Navigation item visible
- **WHEN** the user views the main navigation bar
- **THEN** a "Documenti" entry is visible with an appropriate icon

#### Scenario: Navigation item active state
- **WHEN** the user is on the Documents page
- **THEN** the "Documenti" navigation entry is highlighted as active

#### Scenario: Navigate to Documents page
- **WHEN** the user clicks the "Documenti" navigation entry
- **THEN** the Documents page is displayed

#### Scenario: Chiusure appears before settings
- **WHEN** the user views the main navigation bar
- **THEN** the "Chiusure" entry appears immediately before "Impostazioni"

#### Scenario: Navigate to Chiusure
- **WHEN** the user clicks the "Chiusure" navigation entry
- **THEN** the monthly closing calculator is displayed and "Chiusure" is highlighted as active
