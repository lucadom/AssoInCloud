# Sviluppo locale — AssoInCloud

Guida completa per configurare l'ambiente di sviluppo locale.

---

## Prerequisiti

| Strumento | Versione minima |
|-----------|----------------|
| Java JDK | 17 |
| Maven | 3.9+ (oppure usa il wrapper `./mvnw` incluso) |
| Node.js | 20 |
| npm | 10 |
| Docker + Docker Compose | 20.10 / 2.0 (solo per la modalità Docker) |

---

## Struttura del progetto

```
assoincloud/
├── apps/
│   ├── backend/          # Java 17, Spring Boot 4, Spring Data JPA, Flyway, SQLite
│   └── frontend/         # Next.js 16, React 19, Mantine 8, TypeScript 5
├── data/                 # Directory del database SQLite (git-ignored)
├── docker/               # File Docker (Dockerfile dev, nginx config, entrypoint)
├── docker-compose.yml    # Compose di produzione (container singolo)
├── docker-compose.dev.yml# Compose di sviluppo (hot-reload)
├── AGENTS.md             # Convenzioni per agenti AI
└── DEV.md                # ← questo file
```

---

## Modalità 1 — Esecuzione diretta (senza Docker)

### Backend

```bash
cd apps/backend

# Scarica le dipendenze (prima volta)
./mvnw dependency:go-offline

# Avvia in modalità sviluppo (devtools attivo, porta 8080)
./mvnw spring-boot:run
```

Il backend sarà disponibile su **http://localhost:8080**.
Il database SQLite verrà creato automaticamente in `data/assoincloud.db`
(relativo alla root del progetto).

Per personalizzare il percorso del DB o la password:

```bash
ASSOINCLOUD_DB_PATH=./data/assoincloud.db \
ASSOINCLOUD_PASSWORD=test \
./mvnw spring-boot:run
```

### Frontend

```bash
cd apps/frontend

# Installa le dipendenze (prima volta)
npm ci --legacy-peer-deps

# Avvia il dev server Next.js (porta 3000, HMR attivo)
npm run dev
```

Il frontend sarà disponibile su **http://localhost:3000**.

Per default le chiamate API puntano a `http://localhost:8080/api`.
Per cambiare l'indirizzo:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api npm run dev
```

### Esecuzione dei test

```bash
# Backend — tutti i test
cd apps/backend
./mvnw test

# Backend — singola classe di test
./mvnw test -Dtest=InvoiceServiceCsvImportTest

# Frontend — tutti i test
cd apps/frontend
npm test

# Frontend — watch mode
npm run test:watch

# Frontend — con coverage
npm run test:coverage
```

---

## Modalità 2 — Docker Compose per lo sviluppo (consigliata)

Avvia backend e frontend in container Docker con **hot‑reload**:
le modifiche al codice sorgente si riflettono immediatamente senza
ricostruire le immagini. Il dev server Next.js funge da proxy per
le chiamate `/api/*` verso il backend — nessun nginx necessario.

### Avvio

```bash
docker compose -f docker-compose.dev.yml up --build
```

> Al primo avvio la build scarica le dipendenze Maven e npm (cachate nei
> volumi `maven-repo` e `frontend-node-modules`, quindi i riavvii
> successivi saranno veloci).

### Cosa viene avviato

| Servizio | Immagine | Porta | Descrizione |
|----------|----------|-------|--------------|
| `backend` | JDK 17 + Maven | (interna) | `spring-boot:run` con devtools |
| `frontend` | Node 20 | **80** | `next dev` con HMR; proxy `/api/*` → backend |

L'applicazione è raggiungibile su **http://localhost** (porta 80).

### Architettura in sviluppo

```
Browser  →  Next.js dev server (:3000, esposto su :80)
                ↓ /api/*  (rewrite in next.config.ts)
           Spring Boot (backend:8080, solo rete interna)
```

### Come funziona l'hot-reload

- **Backend** — Il sorgente `apps/backend/src` è montato nel container.
  Spring Boot devtools rileva le modifiche ai file `.java` e riavvia
  automaticamente il contesto applicativo.
- **Frontend** — Il sorgente `apps/frontend/src` è montato nel container.
  Il dev server Next.js applica le modifiche via HMR, aggiornando il
  browser istantaneamente.
- **Database** — La directory `./data` dell'host è montata in `/data` nel
  container backend, quindi il file SQLite è lo stesso che si usa in
  locale.

### Arresto

```bash
docker compose -f docker-compose.dev.yml down
```

### Log

```bash
# Tutti i servizi
docker compose -f docker-compose.dev.yml logs -f

# Solo il backend
docker compose -f docker-compose.dev.yml logs -f backend

# Solo il frontend
docker compose -f docker-compose.dev.yml logs -f frontend
```

### Ricostruzione delle immagini

Necessaria solo se cambiano le dipendenze (`pom.xml` o `package.json`):

```bash
docker compose -f docker-compose.dev.yml up --build
```

### Reset dei volumi

Per ripartire da zero (dipendenze + node_modules):

```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

---

## Variabili d'ambiente

| Variabile | Descrizione | Default |
|-----------|-------------|----------|
| `ASSOINCLOUD_DB_PATH` | Percorso del file SQLite | `./data/assoincloud.db` (locale) · `/data/assoincloud.db` (Docker) |
| `ASSOINCLOUD_PASSWORD` | Password di accesso. Vuota = autenticazione disabilitata | _(vuota)_ |
| `ASSOINCLOUD_PORT` | Porta esposta dall'host (solo Docker) | `80` |
| `SERVER_PORT` | Porta interna Spring Boot (prod Docker) | `8080` |
| `JAVA_OPTS` | Opzioni JVM | `-Xms128m -Xmx512m` |
| `NEXT_PUBLIC_API_URL` | URL base delle API per il frontend | `http://localhost:8080/api` (locale) · `/api` (Docker) |
| `BACKEND_URL` | URL del backend usato dal proxy Next.js dev (solo dev Docker) | `http://localhost:8080` |

> La configurazione della casella PEC (host IMAP, credenziali, SSL) si imposta
> dall'interfaccia web nella pagina **Impostazioni → PEC** e viene salvata nel
> database; non richiede variabili d'ambiente.

Puoi definirle in un file `.env` nella root del progetto (git-ignored):

```env
ASSOINCLOUD_PASSWORD=test
JAVA_OPTS=-Xms256m -Xmx1g
```

---

## Database

- **Engine**: SQLite (file-based in sviluppo, `:memory:` nei test).
- **Schema**: gestito da Flyway (`apps/backend/src/main/resources/db/migration/`).
- **DDL**: `hibernate.ddl-auto=none` — non modificare mai le migration esistenti,
  creare sempre una nuova `V<N>__description.sql`.
- **Percorso**: `data/assoincloud.db` (directory git-ignored).

### Backup e ripristino

```bash
# Backup
cp data/assoincloud.db data/assoincloud.db.bak

# Ripristino
cp data/assoincloud.db.bak data/assoincloud.db
```

### Reset completo

Cancella il file database e riavvia il backend — Flyway ricreerà lo schema:

```bash
rm data/assoincloud.db
```

---

## Convenzioni di sviluppo

Consulta [AGENTS.md](AGENTS.md) per le convenzioni complete. In sintesi:

- **Codice in inglese**, **UI in italiano**.
- **Ogni modifica deve avere test** — nessuna eccezione.
- **No Lombok** — getter/setter espliciti, `record` per i DTO.
- **Constructor injection** — no `@Autowired` sui campi.
- **Flyway** per lo schema — mai `ddl-auto=update`, mai modificare migration esistenti.
- **Mantine UI + Tabler Icons** — non aggiungere altre librerie UI.

---

## Comandi rapidi

| Azione | Comando |
|--------|---------|
| Avvia backend (locale) | `cd apps/backend && ./mvnw spring-boot:run` |
| Avvia frontend (locale) | `cd apps/frontend && npm run dev` |
| Test backend | `cd apps/backend && ./mvnw test` |
| Test frontend | `cd apps/frontend && npm test` |
| Build frontend | `cd apps/frontend && npm run build` |
| Lint frontend | `cd apps/frontend && npm run lint` |
| Dev con Docker | `docker compose -f docker-compose.dev.yml up --build` |
| Stop Docker dev | `docker compose -f docker-compose.dev.yml down` |
| Prod con Docker | `docker compose up -d --build` |
