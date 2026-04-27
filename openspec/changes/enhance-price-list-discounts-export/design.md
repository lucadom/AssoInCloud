## Context

La pagina dei listini prezzi aggrega le righe di fattura per fornitore, raggruppando per `(description, unit_of_measure, unit_price)`. Tuttavia, la colonna `discount_percentage` esiste già sull'entità `InvoiceLineItem` e viene popolata durante l'importazione CSV/XML, ma non viene attualmente inclusa nel raggruppamento né esposta nell'API.

Il risultato è che due acquisti dello stesso articolo con sconti diversi vengono collassati in una riga sola, perdendo l'informazione sullo sconto e sul prezzo effettivo. Inoltre non esiste nessuna funzionalità di esportazione del listino.

## Goals / Non-Goals

**Goals:**
- Includere `discount_percentage` nel GROUP BY della query `findPriceList`, così prezzi con sconti diversi formano righe distinte.
- Esporre `discountPercentage` e `effectiveUnitPrice` (calcolato come `unitPrice × (1 - discountPercentage/100)`) nel DTO e nell'API.
- Aggiungere endpoint `GET /api/price-lists/supplier/{id}/export-xlsx` che produce un file Excel con le stesse righe restituite dalla query.
- Aggiungere endpoint `GET /api/price-lists/supplier/{id}/export-pdf` che genera un PDF con intestazione (fornitore, periodo) e tabella prodotti.
- Aggiornare il frontend per mostrare le nuove colonne e i pulsanti di esportazione.

**Non-Goals:**
- Modifiche alla struttura del database (nessuna migrazione Flyway).
- Gestione di sconti a cascata multipli (sconto2, sconto3) non presenti nel modello attuale.
- Autenticazione o permessi specifici per l'export.

## Decisions

### Decisione 1: calcolo di `effectiveUnitPrice` nel backend (non nel frontend)

**Scelta**: il prezzo effettivo viene calcolato nel `PriceListController.toDto()` come `unitPrice × (1 - discountPercentage/100)`, arrotondato a 4 decimali.

**Alternativa**: calcolarlo nel frontend. Scartata per mantenere la logica di business nel backend e semplificare i test.

### Decisione 2: Apache POI per l'export Excel

**Scelta**: Apache POI (`poi-ooxml`) come già utilizzato nel progetto (export membri XLSX). Nessuna nuova dipendenza da aggiungere.

**Alternativa**: librerie esterne (JasperReports, OpenPDF). Scartata per coerenza con il codice esistente.

### Decisione 3: OpenPDF (iText fork) per la generazione PDF

**Scelta**: OpenPDF (`com.github.librepdf:openpdf`) — libreria leggera, open-source LGPL, senza overhead di JasperReports. Nessuna dipendenza transitiva problematica.

**Alternativa**: JasperReports (troppo pesante), wkhtmltopdf (richiede binario esterno), generazione HTML+CSS (complessa da rendere PDF). Scartate per semplicità.

**Alternativa**: Flying Saucer (XHTML→PDF). Valida ma richiede template HTML; OpenPDF è più diretto per layout tabulari.

### Decisione 4: parametri di export via query string (stesso schema di `getPriceList`)

**Scelta**: gli endpoint export accettano `?from=YYYY-MM-DD&to=YYYY-MM-DD&supplierId` via path, identici al GET principale. Il frontend riusa i valori correnti del filtro.

**Alternativa**: endpoint POST con body JSON. Scartata — GET con download è più idiomatico e consente download diretto dal browser.

### Decisione 5: nessuna variazione nella struttura delle righe del listino

Il GROUP BY esteso a `discount_percentage` è sufficiente per separare righe con sconti diversi. Non serve un campo `purchaseCount` o simili.

## Risks / Trade-offs

- **[Rischio] Più righe per prodotto** → L'utente vede ora più righe per lo stesso prodotto (una per ogni sconto distinto). Mitigazione: la colonna "Sconto" e la colonna "Prezzo effettivo" rendono immediatamente comprensibile la distinzione.
- **[Rischio] OpenPDF prima aggiunta come dipendenza** → Aumento dimensione JAR e tempo di build. Mitigazione: dipendenza leggera (~1 MB), nessun impatto materiale.
- **[Rischio] Layout PDF rigido** → Il PDF generato programmaticamente è poco flessibile. Mitigazione: per un listino interno è sufficiente; futuri miglioramenti possono adottare template Thymeleaf+HTML.
- **[Trade-off] effectiveUnitPrice NULL quando discount è NULL** → Se `discount_percentage` è NULL, `effectiveUnitPrice` coincide con `unitPrice`. Il frontend mostra "—" per lo sconto e il prezzo unitario come prezzo effettivo.
