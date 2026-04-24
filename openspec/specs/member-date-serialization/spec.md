# Spec: member-date-serialization

## Requirements

### Requirement: Date value serialization
The `toDateString` utility SHALL convert any `DatePickerInput` output value (`Date | string | null | undefined`) to a `YYYY-MM-DD` string suitable for the member API payload.

#### Scenario: null input returns undefined
- **WHEN** `toDateString` is called with `null`
- **THEN** it returns `undefined`

#### Scenario: undefined input returns undefined
- **WHEN** `toDateString` is called with `undefined`
- **THEN** it returns `undefined`

#### Scenario: YYYY-MM-DD string input is returned unchanged
- **WHEN** `toDateString` is called with a `YYYY-MM-DD` string (e.g. `"2024-01-15"`)
- **THEN** it returns the same string `"2024-01-15"`

#### Scenario: Date object input is serialized to YYYY-MM-DD
- **WHEN** `toDateString` is called with a `Date` object
- **THEN** it returns a `YYYY-MM-DD` string representing that date

### Requirement: Member form submit with string date
The member form submit handler SHALL produce a valid API payload when `birthDate` or `membershipDate` is a `YYYY-MM-DD` string (as returned by `DatePickerInput` in Mantine 8).

#### Scenario: Create member with string birth date
- **WHEN** the user fills in the member form and `birthDate` is the string `"2024-03-10"` (selected via the date picker)
- **THEN** the create API is called with `birthDate: "2024-03-10"` and no runtime error is thrown

#### Scenario: Create member with string membership date
- **WHEN** the user fills in the member form and `membershipDate` is the string `"2024-03-10"`
- **THEN** the create API is called with `membershipDate: "2024-03-10"` and no runtime error is thrown

#### Scenario: Create member with null dates
- **WHEN** the user fills in the member form and both `birthDate` and `membershipDate` are `null`
- **THEN** the create API is called without `birthDate` and `membershipDate` fields (or with `undefined`)

#### Scenario: Create member with Date object dates (legacy)
- **WHEN** `birthDate` or `membershipDate` is a native `Date` object
- **THEN** the create API is called with the date serialized as `YYYY-MM-DD`
