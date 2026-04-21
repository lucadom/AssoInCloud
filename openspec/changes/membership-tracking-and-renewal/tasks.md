## 1. Database and Domain Model

- [x] 1.1 Add Flyway migration(s) to introduce membership-year storage with member/year uniqueness and deterministic backfill for existing members.
- [x] 1.2 Update backend member entity, DTOs, and mapping logic to include membership years and derived active/inactive status.
- [x] 1.3 Add/adjust repository query support for status filtering (active/inactive) and active-member export selection.

## 2. Backend Lifecycle and Renewal APIs

- [x] 2.1 Implement service-layer status computation using current-year presence in membership years (active/inactive only).
- [x] 2.2 Add explicit member renewal operation endpoint and service command to add current year at any time (including after gap years).
- [x] 2.3 Implement validation/error handling for renewal operations (not found, invalid year data, duplicate current-year renewal behavior) with Italian user-facing messages.
- [x] 2.4 Add logging updates in services/controllers for membership-year retrieval, renewal mutations, filtering, and export.

## 3. Frontend Renewal Experience

- [x] 3.1 Extend member TypeScript types and API client functions to consume membership years, active/inactive filters, renewal responses, and active export.
- [x] 3.2 Update member list UI to show active/inactive status and membership years with status-based filtering controls.
- [x] 3.3 Add renewal action UI flow in the members area, including success/error notifications in Italian and row refresh behavior.

## 4. Testing and Quality Gates

- [x] 4.1 Add backend tests for year-based active/inactive computation, migration/backfill behavior, renewal success path after gap years, and duplicate-year handling.
- [ ] 4.2 Add frontend tests for status rendering, active-member filtering, renewal action integration, and active export behavior.
- [x] 4.3 Run backend verification with coverage threshold (`cd apps/backend && ./mvnw verify`) and resolve any regressions.
- [x] 4.4 Run frontend coverage checks (`cd apps/frontend && npm run test:coverage`) and verify production build (`cd apps/frontend && npm run build`).

## 5. Documentation and Rollout

- [x] 5.1 Update AGENTS.md feature/capability and API sections to reflect membership-year tracking, active/inactive semantics, and active export.
- [x] 5.2 Update DEV.md and README.md with new behavior and workflows for year-based renewal management and active-member export.
- [ ] 5.3 Validate final OpenSpec artifacts and ensure implementation is ready to start via `/opsx:apply`.
