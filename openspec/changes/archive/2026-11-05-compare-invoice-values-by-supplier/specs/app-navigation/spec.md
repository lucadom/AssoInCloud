# Spec Delta

## ADDED Requirements

### Requirement: Group invoice pages in the navigation
The application navigation SHALL group invoice-related pages under an expandable "Fatture" entry with "Elenco" and "Confronto" child entries.

#### Scenario: Open the invoice list
- **WHEN** the user selects "Elenco" under "Fatture"
- **THEN** the existing invoice list page is displayed and its child navigation entry is active

#### Scenario: Open invoice comparison
- **WHEN** the user selects "Confronto" under "Fatture"
- **THEN** the supplier invoice comparison page is displayed and its child navigation entry is active

#### Scenario: Highlight invoice group
- **WHEN** either invoice page is active
- **THEN** the "Fatture" navigation group is highlighted as active
