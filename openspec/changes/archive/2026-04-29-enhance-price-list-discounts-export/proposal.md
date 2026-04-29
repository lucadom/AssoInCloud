## Why

La pagina dei listini prezzi mostra il prezzo unitario senza considerare gli sconti applicati nelle fatture, rendendo impossibile conoscere il prezzo effettivo pagato. Manca inoltre la possibilità di esportare il listino generato per condivisione o archiviazione.

## What Changes

- Il listino prezzi include ora la percentuale di sconto e il prezzo effettivo (prezzo unitario × (1 - sconto/100)) per ogni riga.
- Due acquisti dello stesso prodotto con sconti diversi generano righe separate nel listino (il GROUP BY della query include `discount_percentage`).
- Aggiunto endpoint per esportare il listino corrente in formato Excel (.xlsx).
- Aggiunto endpoint per generare un PDF del listino prezzi contenente i dati del fornitore, il periodo esaminato e la tabella prodotti.
- La pagina frontend mostra le nuove colonne (sconto, prezzo effettivo) e i pulsanti di esportazione Excel e PDF.

## Capabilities

### New Capabilities

- `price-list-discounts`: Aggiunta della percentuale di sconto e del prezzo effettivo alle righe del listino; il GROUP BY della query include `discount_percentage` in modo che prezzi con sconti diversi generino righe distinte.
- `price-list-excel-export`: Esportazione del listino prezzi filtrato in formato Excel (.xlsx) tramite nuovo endpoint `GET /api/price-lists/supplier/{id}/export-xlsx`.
- `price-list-pdf-export`: Generazione di un PDF del listino prezzi tramite nuovo endpoint `GET /api/price-lists/supplier/{id}/export-pdf`, contenente intestazione con dati fornitore e periodo, e tabella prodotti con tutte le colonne del listino.

### Modified Capabilities

_(nessuna)_

## Impact

- **Backend**: `InvoiceLineItemRepository` (query `findPriceList` aggiornata), `PriceListItemDto` (nuovi campi), `PriceListController` (nuovi endpoint export-xlsx e export-pdf), nuova dipendenza Apache POI per Excel.
- **Frontend**: `PriceListItem` type (nuovi campi), `price-lists.ts` API client (nuove funzioni), `price-list-page.tsx` (nuove colonne e pulsanti export).
- **Nessuna migrazione Flyway richiesta** (nessun nuovo schema DB; i campi `discount_percentage` già esistono su `invoice_line_items`).
