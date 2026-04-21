## Context

AssoInCloud currently manages member registry data but does not model membership as explicit yearly participation history. Operators need to know whether a member is active for the current year, allow renewals at any time during the year, and preserve gaps where members were inactive for one or more years. The change must align with current architecture (Spring Boot backend, Next.js frontend, SQLite with Flyway migrations), preserve existing member records, and remain compatible with import/export flows.

## Goals / Non-Goals

**Goals:**
- Introduce explicit membership year tracking for each member.
- Use a fixed membership window for each year (January 1 to December 31).
- Provide renewal operations that add current-year membership at any time without expiry cutoffs.
- Expose APIs and UI filtering so staff can quickly identify active and inactive members.
- Support export of active members.
- Ensure safe migration for existing members with clear defaults and no data loss.
- Define testable behavior for year-based status computation and renewal actions.

**Non-Goals:**
- Integrating payment gateways or accounting settlement flows for membership fees.
- Building multi-year forecasting or advanced analytics dashboards in this change.
- Replacing existing member import/export formats beyond required lifecycle field support.

## Decisions

1. Persist membership years and derive status server-side
- Decision: Store membership years per member as the canonical source of truth and compute status server-side from current-year presence.
- Rationale: Explicit year history preserves gaps (for example 2022, 2023, 2026) and keeps status derivation simple and deterministic.
- Alternative considered: Persist only a mutable status flag. Rejected because it loses historical detail and cannot represent non-contiguous membership accurately.

2. Keep renewal completion as an explicit command endpoint
- Decision: Add a dedicated renewal action endpoint (for example member-level renew command) that records the current year for the member.
- Rationale: Renewal is a domain operation with idempotency and validation rules that should be explicit, logged, and testable.
- Alternative considered: Generic PUT update with client-controlled year arrays. Rejected to avoid inconsistent business logic and accidental corruption of history.

3. Use deterministic default migration for existing members
- Decision: Introduce Flyway migration(s) to add membership-years storage and backfill deterministic defaults from existing member data when available, with defensive fallbacks for missing data.
- Rationale: This enables a no-downtime style transition and keeps historical members usable immediately after deployment.
- Alternative considered: Require manual data re-entry after release. Rejected due to high operational cost and risk of data gaps.

4. Provide active/inactive filtering and active export via backend query parameters
- Decision: Extend member listing and export endpoints to support status filtering based on active/inactive semantics.
- Rationale: Server-side filtering scales better and keeps semantics consistent across UI and exports.
- Alternative considered: Client-side filtering after full fetch. Rejected for performance and consistency reasons.

5. Validate renewal and year-history invariants in service layer
- Decision: Enforce invariants (cannot renew non-existent member, cannot insert invalid year values, cannot duplicate the same member/year entry) in service methods under transaction boundaries.
- Rationale: Preserves data integrity and ensures predictable API behavior.
- Alternative considered: Rely on frontend form validation only. Rejected because API clients other than UI can bypass browser checks.

## Risks / Trade-offs

- [Risk] Year derivation and timezone around New Year boundaries may cause incorrect active/inactive status.
  → Mitigation: Use server-local date policy explicitly and derive current year consistently in backend logic/tests.
- [Risk] Backfilled defaults for legacy members may not match association-specific policies.
  → Mitigation: Use conservative defaults and provide administrative edit capability for lifecycle fields.
- [Risk] Additional member query/export filters could increase complexity and regression risk in existing behavior.
  → Mitigation: Add focused controller/service tests for combined filters and maintain backward-compatible defaults.
- [Risk] Duplicate year insertion under concurrent renewal requests.
  → Mitigation: Keep renewal operation transactional and enforce uniqueness constraints for member/year entries.

## Migration Plan

1. Add Flyway migration introducing membership-year storage with constraints supporting unique member/year entries.
2. Backfill membership years for existing rows using deterministic rules.
3. Deploy backend with active/inactive computation, renewal endpoint, status filtering, and active export support.
4. Deploy frontend updates that surface status, renewal actions, and active filtering/export controls.
5. Validate with post-deploy checks (members list queries by status, sample renewal operation, active export verification).
6. Rollback strategy: revert application deployment and restore DB from backup if migration outcomes are unacceptable.

## Open Questions

- Should the system allow creating/adjusting historical year entries manually (admin correction), or only current-year renewal action?
- Should active export be a dedicated endpoint or a filtered variant of the existing members export endpoint?
- What deterministic rule should be used to initialize membership years for legacy members with incomplete historical data?
