# AssoInCloud

[![Tests](https://github.com/lucadom/AssoInCloud/actions/workflows/tests.yml/badge.svg)](https://github.com/lucadom/AssoInCloud/actions/workflows/tests.yml)
[![codecov](https://codecov.io/gh/lucadom/AssoInCloud/branch/main/graph/badge.svg)](https://codecov.io/gh/lucadom/AssoInCloud)

Applicazione web per la gestione di associazioni e ONLUS. Permette di gestire
soci, fatture elettroniche (FatturaPA), fornitori, prodotti, listini prezzi e di
consultare la casella PEC dell'associazione.

## Funzionalità principali

| Funzionalità | Descrizione |
|-------------|-------------|
| **Soci** | Anagrafica con codice fiscale; importazione CSV e esportazione XLSX |
| **Fatture** | Importazione da CSV e da file FatturaPA XML/P7M; visualizzazione con dettaglio righe e allegati |
| **Fornitori** | Gestione anagrafica; creati automaticamente dall'importazione fatture |
| **Prodotti** | Ricerca nel catalogo prodotti |
| **Listini** | Gestione listini prezzi collegati ai prodotti |
| **Backup** | Backup e ripristino del database tramite API |
| **PEC** | Consultazione in sola lettura della casella PEC tramite IMAP (cartelle, messaggi, allegati) |

## Architettura

| Componente | Tecnologia |
|------------|-----------|
| Backend | Java 17, Spring Boot 4, Spring Data JPA, Flyway, SQLite |
| Frontend | Next.js 16, React 19, Mantine 8, TypeScript 5 |
| Database | SQLite (file-based) |

L'applicazione è distribuita come un **singolo container Docker** che include:

- **Backend** — API REST Spring Boot; serve anche il frontend come file statici
- **Frontend** — Next.js compilato come export statico (HTML/CSS/JS)

```
                    ┌─────────────────────────────────┐
                    │         Container Docker         │
                    │                                  │
  porta esterna ── │  Spring Boot :8080               │
                    │    ├─ /api/*  ─→ API REST        │
                    │    └─ /*      ─→ Frontend statico│
                    │                                  │
                    │  volume /data ─→ SQLite DB       │
                    └─────────────────────────────────┘
```

---

## Deploy con Docker Compose

### Prerequisiti

- [Docker](https://docs.docker.com/get-docker/) ≥ 20.10
- [Docker Compose](https://docs.docker.com/compose/install/) ≥ 2.0

### Avvio rapido

```bash
# Clona il repository
git clone <repository-url>
cd assoincloud

# Avvia l'applicazione (build + start)
docker compose up -d --build
```

L'applicazione sarà disponibile su **http://localhost**.

### Arresto

```bash
docker compose down
```

Per rimuovere anche il volume dei dati (⚠️ cancella il database):

```bash
docker compose down -v
```

---

## Configurazione

Tutti i parametri sono configurabili tramite **variabili d'ambiente** passate al
container. Si possono definire nel file `docker-compose.yml`, in un file `.env`
nella stessa directory, oppure inline al lancio.

### Variabili d'ambiente

| Variabile | Descrizione | Valore predefinito |
|-----------|-------------|-------------------|
| `ASSOINCLOUD_PORT` | Porta esposta dall'host | `80` |
| `ASSOINCLOUD_DB_PATH` | Percorso del file database SQLite dentro al container | `/data/assoincloud.db` |
| `ASSOINCLOUD_PASSWORD` | Password di accesso all'applicazione. Se vuota, l'autenticazione è disabilitata | _(vuota)_ |
| `JAVA_OPTS` | Opzioni JVM (memoria, GC, ecc.) | `-Xms128m -Xmx512m` |
| `SERVER_PORT` | Porta interna del backend Spring Boot (coincide con la porta esposta al netto del mapping) | `8080` |

> **Nota:** `SERVER_PORT` è il parametro interno al container; `ASSOINCLOUD_PORT` è la porta remappata sull'host.
>
> La configurazione della casella PEC (host, porta, credenziali IMAP) si imposta
> direttamente dall'interfaccia web nella pagina **Impostazioni → PEC**; non
> richiede variabili d'ambiente.

### Esempio con file `.env`

Crea un file `.env` nella root del progetto (accanto a `docker-compose.yml`):

```env
# Porta su cui esporre l'applicazione sull'host
ASSOINCLOUD_PORT=8888

# Password di accesso (lasciare vuota per disabilitare l'autenticazione)
ASSOINCLOUD_PASSWORD=miapassword

# Percorso database dentro al container (deve essere nel volume /data)
ASSOINCLOUD_DB_PATH=/data/assoincloud.db

# Opzioni JVM — aumenta la memoria se necessario
JAVA_OPTS=-Xms256m -Xmx1g
```

Poi avvia normalmente:

```bash
docker compose up -d --build
```

L'applicazione sarà raggiungibile su **http://localhost:8888**.

### Esempio con variabili inline

```bash
ASSOINCLOUD_PORT=9090 JAVA_OPTS="-Xms256m -Xmx1g" docker compose up -d --build
```

---

## Persistenza dei dati

Il database SQLite è memorizzato nel volume Docker `assoincloud-data`, montato
su `/data` all'interno del container. Questo garantisce che i dati sopravvivano
al riavvio o alla ricostruzione del container.

### Backup del database

```bash
# Copia il database dall'interno del volume
docker cp assoincloud:/data/assoincloud.db ./backup-assoincloud.db
```

### Ripristino del database

```bash
# Arresta il container
docker compose down

# Copia il backup nel volume
docker cp ./backup-assoincloud.db assoincloud:/data/assoincloud.db

# Riavvia
docker compose up -d
```

### Uso di una directory host personalizzata

Se si preferisce montare una directory dell'host anziché un volume Docker,
modificare `docker-compose.yml`:

```yaml
services:
  assoincloud:
    volumes:
      # Sostituisci il volume con un bind mount
      - /percorso/sulla/macchina/data:/data
```

E rimuovere la sezione `volumes:` in fondo al file.

---

## Struttura dei file Docker

```
assoincloud/
├── Dockerfile            # Build multi-stage (backend + frontend + runtime)
├── docker-compose.yml    # Orchestrazione del container
├── .dockerignore         # File esclusi dal contesto di build
└── docker/
    └── entrypoint.sh     # Script di avvio del container
```

### Dockerfile — Fasi di build

1. **backend-build** — Compila il backend Spring Boot con Maven, produce `backend.jar`
2. **frontend-build** — Installa le dipendenze npm e compila Next.js come export statico (`out/`)
3. **runtime** — Immagine finale leggera (JRE 17) con `backend.jar` e il frontend statico in `/app/static/`

---

## Comandi utili

```bash
# Build e avvio
docker compose up -d --build

# Solo build (senza avvio)
docker compose build

# Visualizza i log in tempo reale
docker compose logs -f

# Visualizza lo stato del container
docker compose ps

# Riavvio del container
docker compose restart

# Arresto e rimozione
docker compose down

# Accesso alla shell del container
docker exec -it assoincloud bash
```

---

## Risoluzione problemi

### Il container non si avvia

Controlla i log per identificare l'errore:

```bash
docker compose logs
```

### Errore di porta già in uso

Se la porta 80 è già occupata, cambia la porta esposta:

```bash
ASSOINCLOUD_PORT=8080 docker compose up -d
```

### Il database è corrotto

Arresta il container, rimuovi il volume e riavvia (verrà creato un database vuoto):

```bash
docker compose down -v
docker compose up -d
```

### Memoria insufficiente

Aumenta la memoria allocata alla JVM:

```bash
JAVA_OPTS="-Xms256m -Xmx2g" docker compose up -d
```
