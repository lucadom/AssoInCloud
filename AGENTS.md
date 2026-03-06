# AGENTS.md — Guidelines for Agentic LLM Development

This document defines conventions, workflows, and constraints that any AI coding
agent **must** follow when working on the AssoInCloud project.

---

## 1. Project Overview

AssoInCloud is an Italian association management application.

| Layer | Tech | Location |
|-------|------|----------|
| Backend | Java 17, Spring Boot 4, Spring Data JPA, Flyway, SQLite | `apps/backend/` |
| Frontend | Next.js 16, React 19, Mantine 8, TypeScript 5 | `apps/frontend/` |
| Database | SQLite (file `data/assoincloud.db`, in-memory for tests) | — |

The current domain models and features are:

| Feature | Domain | Notes |
|---------|--------|-------|
| Invoices (fatture) | `Invoice`, `InvoiceLineItem`, `InvoiceAttachment` | Import via CSV and FatturaPA XML; P7M extraction |
| Suppliers (fornitori) | `Supplier` | Auto-created during invoice import |
| Members (soci) | `Member` | Registry with fiscal code; CSV/XLSX import and export |
| Price lists (listini) | `PriceListItem` | Linked to products |
| Products (prodotti) | — | Read-only product catalogue search |
| Backup | — | Database backup/restore via API |
| PEC inbox | — | Read-only IMAP access; stateless message access; IMAP config stored in `settings` table |
| App settings | `AppSetting` | Key-value settings table; currently stores PEC IMAP configuration |

---

## 2. Language Conventions

### 2.1 Code — English only

All identifiers (classes, methods, variables, constants, DB columns, REST
endpoints, TypeScript types, file names) **must** be in English.

```java
// ✅ Good
public class InvoiceService { ... }
private Supplier resolveSupplier(String vatNumber, String name) { ... }

// ❌ Bad
public class ServizioFattura { ... }
private Fornitore trovaFornitore(String partitaIva) { ... }
```

Code comments and Javadoc/JSDoc should be in English as well.

### 2.2 User-facing text — Italian only

Everything the end user sees — UI labels, button captions, notification
messages, error messages shown in the frontend, placeholder text — **must** be
in Italian.

```tsx
// ✅ Good
notifications.show({ title: "Errore", message: "Impossibile caricare le fatture", color: "red" });

// ❌ Bad
notifications.show({ title: "Error", message: "Unable to load invoices", color: "red" });
```

Italian is also used in error messages that bubble up from the backend to the
user (e.g. `"Errore durante l'elaborazione del CSV"`).

### 2.3 Domain terminology reference

| English (code) | Italian (UI) |
|-----------------|-------------|
| Invoice | Fattura |
| Supplier | Fornitore |
| VAT number | Partita IVA |
| Taxable amount | Imponibile |
| Tax amount | Imposta |
| Total amount | Totale |
| Invoice number | Numero fattura |
| Date | Data |
| Viewed | Visualizzata |
| Line item | Dettaglio linea |
| Attachment | Allegato |
| Upload | Carica |
| Delete | Elimina |
| Create | Crea / Nuova |
| Edit | Modifica |
| Save | Salva |
| Member | Socio |
| Fiscal code | Codice fiscale |
| Birth date | Data di nascita |
| Membership date | Data di accettazione |
| Price list | Listino |
| PEC inbox | Casella PEC |
| Folder | Cartella |
| Unread | Da leggere |

---

## 3. Testing — Mandatory for Every Change

### 3.1 Golden rule

**Every code change must be accompanied by tests. No exceptions.**

- New feature → write tests covering the happy path and relevant edge cases.
- Bug fix → write a test that reproduces the bug **before** fixing it, then
  verify it passes after the fix.
- Refactor → run existing tests to confirm nothing is broken; add tests if
  coverage gaps are discovered.

**Coverage requirement:** after every change, **all tests in both backend and
frontend must pass** and the overall line/branch coverage in each project must
remain **≥ 70 %**. A change that causes coverage to drop below this threshold
must not be merged until coverage is restored.

### 3.2 Backend testing

| Concern | Style | Example |
|---------|-------|---------|
| Service logic with real DB | `@SpringBootTest` integration test with in-memory SQLite | `InvoiceServiceCsvImportTest` |
| Parsers, converters, utilities | Unit test with Mockito (`@ExtendWith(MockitoExtension.class)`) | `FatturaElettronicaParserTest` |
| Controllers | `@WebMvcTest` or `@SpringBootTest` with `MockMvc` | — |

**Test class placement** mirrors the source tree:
```
src/main/java/it/assoincloud/backend/service/InvoiceService.java
src/test/java/it/assoincloud/backend/service/InvoiceServiceCsvImportTest.java
```

**Test configuration** for integration tests:
```java
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
@Transactional   // auto-rollback after each test
```

**Naming convention** for test methods:
```
methodUnderTest_should_expectedBehavior_when_condition
```
Examples:
```java
void importCsvShouldImportAllRows()
void parseShouldExtractSupplierAndCreateIfNotExists()
void importCsvTwiceShouldUpsertNotDuplicate()
```

**Running tests:**
```bash
cd apps/backend
./mvnw test                              # all tests
./mvnw test -Dtest=InvoiceServiceCsvImportTest   # single class
```

**Running tests with coverage** (JaCoCo — enforces the 70 % minimum):
```bash
cd apps/backend
./mvnw verify          # runs tests + JaCoCo report; fails if coverage < 70 %
```
The HTML report is generated at `target/site/jacoco/index.html`.

### 3.3 Frontend testing

Use Vitest (configured in `vitest.config.ts`). Test files go next to the
source file or under a `__tests__` directory.

**Running tests:**
```bash
cd apps/frontend
npm test              # all tests (watch mode)
npm run test:run      # single pass (CI mode)
```

**Running tests with coverage** (enforces the 70 % minimum):
```bash
cd apps/frontend
npm run coverage      # runs Vitest with --coverage; fails if coverage < 70 %
```
The HTML report is generated at `coverage/index.html`.

### 3.4 Test data

Reuse existing test fixtures in `src/test/resources/examples/`:
- `invoices.csv` — sample CSV export with 54 rows and 14 distinct suppliers.
- `invoice.xml` — sample FatturaPA XML (Sammontana, 31 line items).

When adding new test scenarios, add fixture files to the same directory and
load them via `ClassPathResource` or `getResourceAsStream`.

---

## 4. Code Style & Formatting

### 4.1 Java (Backend)

- **No Lombok**: the project does not use Lombok. Write explicit getters,
  setters, constructors (or use Java records for DTOs).
- **Records for DTOs**: prefer `record` types for immutable data carriers
  (see `InvoiceFormData`, `InvoiceDto`).
- **Entities are plain classes** with explicit getters/setters.
- **Constructor injection** — no field injection with `@Autowired`.
- **Explicit imports** — avoid wildcard imports (`import java.util.*;`). Import
  each class individually.
- **`@Transactional`** on the service class; use `@Transactional(readOnly = true)`
  for read-only methods.
- **Indentation**: 4 spaces.
- **Braces**: opening brace on the same line (K&R style).
- **Max line length**: ~120 characters.
- Keep single-line getters/setters when the body is trivial:
  ```java
  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  ```

### 4.2 TypeScript / React (Frontend)

- **Strict TypeScript** (`"strict": true` in tsconfig).
- **Functional components only** — no class components.
- **`"use client"`** directive at the top of interactive component files.
- **Named exports** — avoid default exports for components.
- **Path aliases**: use `@/` to reference the `src/` directory
  (e.g. `import type { Invoice } from "@/types"`).
- **Mantine UI** — use Mantine components for all UI elements; do not introduce
  additional UI libraries.
- **Tabler Icons** — use `@tabler/icons-react` for icons.
- **Indentation**: 2 spaces.
- **Semicolons**: required.
- **Quotes**: double quotes for JSX attributes, double quotes for strings.
- Types go in `src/types/`; API functions go in `src/lib/api/`.
- Component files use kebab-case: `invoice-form-modal.tsx`,
  `suppliers-table.tsx`.

### 4.3 SQL (Flyway Migrations)

- **Never modify existing migration files.** Create a new `V<N>__description.sql`.
- Use `snake_case` for table and column names.
- Always include `IF NOT EXISTS` for `CREATE TABLE`.
- Include foreign-key constraints with `ON DELETE CASCADE` where appropriate.
- SQLite types: `TEXT`, `REAL`, `INTEGER`, `BLOB`.

---

## 5. Architecture & Layering

### 5.1 Backend layers

```
Controller  →  Service  →  Repository  →  Entity
     ↕              ↕
    DTO           Entity
```

- **Entity** (`entity/`): JPA-annotated classes mapped to DB tables.
- **Repository** (`repository/`): Spring Data JPA interfaces.
- **Service** (`service/`): business logic, transactional boundaries.
- **Controller** (`controller/`): REST endpoints, maps DTOs.
- **DTO** (`dto/`): records for API request/response payloads. Use static
  `from(Entity)` factory methods for entity-to-DTO mapping.
- **Config** (`config/`): Spring configuration beans.
- **Converter** (`converter/`): JPA attribute converters.

### 5.2 Frontend structure

```
src/
├── app/              # Next.js App Router (layout, pages)
├── components/       # React components
│   ├── invoices/     # Invoice sub-components (modals, table)
│   ├── members/      # Member sub-components
│   ├── suppliers/    # Supplier sub-components
│   └── pec/          # PEC inbox sub-components (folder-list, message-list, message-viewer)
├── lib/api/          # API client functions (fetch wrappers)
└── types/            # TypeScript interfaces
```

**Navigation** is managed entirely by `app-layout.tsx`. To add a new page:
1. Add the page string to the `Page` union type.
2. Add an entry to the `navItems` array with `label`, `value`, and an icon from `@tabler/icons-react`.
3. Import the new page component and render it conditionally inside `<AppShell.Main>`.

### 5.3 REST API conventions

- Base path: `/api/`
- Current resources:
  - `/api/invoices` — invoice CRUD, CSV/XML import, XLSX export
  - `/api/suppliers` — supplier CRUD
  - `/api/members` — member CRUD, CSV/XLSX import/export
  - `/api/products` — product search
  - `/api/price-lists` — price list CRUD
  - `/api/backup` — backup/restore
  - `/api/auth` — login/logout (unauthenticated)
  - `/api/pec` — read-only IMAP inbox (folders, messages, attachments)
  - `/api/settings` — application settings (currently PEC IMAP config)
- CRUD: `GET`, `POST`, `PUT`, `DELETE` on resource endpoints.
- File uploads: `POST` with `multipart/form-data`.
- IDs are UUIDs (string).
- Response DTOs — never return raw entities.

### 5.4 Stateless services (no DB persistence)

Not every service needs an entity or Flyway migration. For features that consume
external data without storing it (e.g. the PEC/IMAP integration), the pattern is:

```
Controller  →  Service  →  External system (IMAP, HTTP, …)
     ↕
    DTO
```

- No entity, no repository, no migration.
- Configuration comes exclusively from `@Value`-injected properties backed by
  env vars (e.g. `ASSOINCLOUD_PEC_HOST`, `ASSOINCLOUD_PEC_PASSWORD`).
- The service exposes an `isConfigured()` guard; the controller returns HTTP 404
  with an Italian error message when the feature is not configured.
- Document the required env vars in `application.yaml`, `docker-compose.yml`,
  `docker-compose.dev.yml`, `DEV.md`, and `README.md`.

---

## 6. Database

- **Engine**: SQLite (file-based for production, `:memory:` for tests).
- **Schema management**: Flyway migrations in
  `src/main/resources/db/migration/`.
- **Hibernate DDL**: `ddl-auto=none` — schema is fully managed by Flyway.
- **ID strategy**: `GenerationType.UUID` (string UUIDs).
- **Upsert logic**: for imports (CSV/XML), match by
  `supplier.vatNumber + invoiceNumber` to avoid duplicates.

---

## 7. Development Workflow for Agents

### 7.1 Before starting

1. Read this file (`AGENTS.md`) to understand conventions.
2. Read `DEV.md` for environment setup and run instructions.
3. Understand the existing code by exploring the relevant layers.

### 7.2 Making changes

1. **Understand the requirement** — read related code, entity definitions,
   and existing tests.
2. **Plan the change** — identify which layers are affected (entity, migration,
   repository, service, controller, DTO, frontend types, API client, UI
   components).
3. **Implement bottom-up**: migration → entity → repository → service → test →
   controller → DTO → frontend types → API client → UI component.
4. **Write tests first or alongside** — never defer testing to later.
5. **Run all tests and verify coverage** after every meaningful change:
   ```bash
   cd apps/backend && ./mvnw verify          # tests + JaCoCo coverage ≥ 70 %
   cd apps/frontend && npm run coverage      # tests + Vitest coverage ≥ 70 %
   ```
   Both commands must exit successfully (zero) before the change is
   considered done.
6. **Verify the frontend compiles**:
   ```bash
   cd apps/frontend && npm run build
   ```
7. **Update documentation** — after every feature addition or change, update
   the relevant sections in `AGENTS.md`, `DEV.md`, and `README.md`:
   - New env vars → add to the variables tables in `DEV.md` and `README.md`.
   - New domain model or feature → update the feature table in `AGENTS.md` §1.
   - New REST endpoint → add to the resources list in `AGENTS.md` §5.3.
   - New terminology → add to the terminology table in `AGENTS.md` §2.3.

### 7.3 Commit discipline

- Each logical change should be self-contained and tested.
- Do not leave the codebase in a broken state (tests must pass).
- **All tests** (backend and frontend) must **pass** and coverage must remain
  **≥ 70 %** in both projects before a change is committed.
- Documentation must be up to date before the change is considered done.

---

## 8. Logging

### 8.1 Backend (SLF4J / Logback)

Every service class must declare a logger:

```java
private static final Logger log = LoggerFactory.getLogger(MyService.class);
```

Level conventions:

| Level | When to use |
|-------|-------------|
| `log.info(...)` | Main operations: every CRUD mutation, import/export start and completion, backup/restore |
| `log.warn(...)` | Business-rule rejections (duplicate key, conflict, not configured) |
| `log.error(...)` | Caught exceptions that result in an error response; always include the exception as the last argument |
| `log.debug(...)` | Read-only lookups and low-level detail useful only for troubleshooting |

Controllers only add logs for:
- Aggregated multi-file uploads (total counts logged at INFO).
- Caught exceptions that produce HTTP 4xx/5xx responses (`warn`/`error`).

Services log the actual business operations; controllers must not duplicate them.

### 8.2 Frontend (`src/lib/logger.ts`)

Use the shared `logger` utility imported from `@/lib/logger` (or via the
relative path `../logger` inside `src/lib/api/`):

```typescript
import { logger } from "../logger";
```

Level conventions:

| Level | When to use |
|-------|-------------|
| `logger.info(...)` | Every API call that fetches, creates, updates, or deletes data |
| `logger.warn(...)` | Recoverable situations (PEC not configured, 404 "not found") |
| `logger.error(...)` | API call failed (`!res.ok`); include HTTP status and backend error message |
| `logger.debug(...)` | Verbose detail needed only during development |

`info` and `debug` are silenced in production (`NODE_ENV === "production"`).

### 8.3 Maintenance rules

- **Keep logs up to date** — when you rename, refactor, or remove a feature,
  update or remove the corresponding log statements.
- **Add logs for new features** — every new service method and API function that
  performs data mutation or retrieval must include appropriate log calls.
- **Never log sensitive data** — passwords, full auth tokens, and personal data
  (e.g. fiscal codes in plain text) must not appear in log messages.

---

## 9. Common Pitfalls to Avoid

- **Don't add Lombok** — the project deliberately avoids it.
- **Don't use wildcard imports** in Java.
- **Don't modify existing Flyway migrations** — always create new ones.
- **Don't return JPA entities from controllers** — always map to DTOs.
- **Don't use `@Autowired` field injection** — use constructor injection.
- **Don't introduce new UI libraries** — stick to Mantine/Tabler Icons.
- **Don't hardcode the API base URL** — use the `NEXT_PUBLIC_API_URL` env var.
- **Don't write English-language UI labels** — all user-facing text is Italian.
- **Don't write Italian code identifiers** — all code is in English.
- **Don't skip tests** — every change must have corresponding test coverage.
- **Don't let coverage drop below 70 %** — both backend (`./mvnw verify`) and
  frontend (`npm run coverage`) must report ≥ 70 % line/branch coverage after
  every change.
- **Don't use `ddl-auto=update`** — all schema changes go through Flyway.
- **Don't hardcode configuration** — new external integrations (IMAP, SMTP, …)
  must read credentials exclusively from `@Value`-injected env vars; never embed
  host names, usernames, or passwords in source code.
- **Don't skip documentation** — `AGENTS.md`, `DEV.md`, and `README.md` must
  reflect the current state of the project after every change.
- **Don't skip logging** — every new service method and API client function that
  performs data retrieval or mutation must include `log.info` / `logger.info`
  calls; errors must use `log.error` / `logger.error`. Keep existing logs
  consistent when refactoring.

---

## 9. Extending the Project — Checklist

When adding a new **persisted** feature (new entity + DB table):

- [ ] Flyway migration (`V<N>__description.sql`) for schema changes
- [ ] JPA entity class in `entity/`
- [ ] Spring Data repository in `repository/`
- [ ] Service class with business logic in `service/`
- [ ] DTO record(s) in `dto/` with `from()` factory
- [ ] REST controller in `controller/`
- [ ] Integration and/or unit tests
- [ ] Add `log.info` / `log.warn` / `log.error` calls in the new service methods
- [ ] TypeScript type in `src/types/`
- [ ] API client function in `src/lib/api/` with `logger` calls for each operation
- [ ] UI component(s) with Italian labels
- [ ] Run all tests and verify coverage ≥ 70 % in both projects:
      `cd apps/backend && ./mvnw verify`
      `cd apps/frontend && npm run coverage`
- [ ] Verify frontend build: `cd apps/frontend && npm run build`
- [ ] Update `AGENTS.md` §1 (feature table), §2.3 (terminology), §5.3 (API list)
- [ ] Update env var tables in `DEV.md` and `README.md`

When adding a new **stateless** feature (external integration, no DB):

- [ ] Service class (reads config from `@Value` env vars; exposes `isConfigured()` guard)
- [ ] DTO record(s) in `dto/`
- [ ] REST controller returning HTTP 404 with Italian message when not configured
- [ ] Unit tests for `isConfigured()` and any parsing/transformation logic
- [ ] Controller integration tests verifying the "not configured" 404 path
- [ ] Add `log.info` / `log.warn` / `log.error` calls in the new service methods
- [ ] New env vars documented in `application.yaml`, `docker-compose.yml`, `docker-compose.dev.yml`
- [ ] TypeScript type in `src/types/`
- [ ] API client function in `src/lib/api/` (handle 404 → user-friendly `notConfigured` flag) with `logger` calls
- [ ] UI component(s) with Italian labels; show an `Alert` when `notConfigured`
- [ ] Run all tests and verify coverage ≥ 70 % in both projects:
      `cd apps/backend && ./mvnw verify`
      `cd apps/frontend && npm run coverage`
- [ ] Verify frontend build: `cd apps/frontend && npm run build`
- [ ] Update `AGENTS.md` §1, §2.3, §5.3 (stateless section)
- [ ] Update env var tables in `DEV.md` and `README.md`