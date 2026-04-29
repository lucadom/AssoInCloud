## Why

The current member registry does not track membership as explicit calendar years per member. This makes it hard to know who is active for the current year, preserve historical gaps in participation, and reliably filter/export active members.

## What Changes

- Introduce per-member membership year tracking (for example 2022, 2023, 2026) as the canonical renewal history.
- Define membership period as fixed yearly window (January 1 to December 31) with two statuses only: active and inactive.
- Define active status as: member has the current year in membership years; otherwise inactive.
- Add renewal flows that allow adding the current year at any time, without expiration cutoffs, and preserving gap years.
- Add backend APIs and frontend views/controls to filter active members.
- Add active-member export support from the existing members export flow.
- Add notifications and validation rules for renewal-related operations to reduce manual errors.

## Capabilities

### New Capabilities
- `membership-year-tracking`: Track explicit membership years per member and derive active/inactive status from current-year presence.
- `membership-renewal-management`: Record renewals as yearly entries, preserve non-contiguous year history, and expose active-member filtering/export behaviors.

### Modified Capabilities
- None.

## Impact

- Backend: new/updated member domain model for membership years, service logic, controller endpoints, DTO mappings, and Flyway migration(s).
- Frontend: member types, API client functions, member table/forms, active/inactive status filtering, renewal action UI, and export controls.
- Tests: backend integration/unit coverage for year-based status and renewal rules; frontend component/API tests for renewal, active filtering, and export behavior.
- Documentation: updates to AGENTS.md, DEV.md, and README.md for feature/API behavior and any configuration changes.
