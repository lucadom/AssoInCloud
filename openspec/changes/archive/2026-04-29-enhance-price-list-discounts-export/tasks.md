## 1. Backend — Sconti nel listino prezzi

- [x] 1.1 Aggiornare la query `findPriceList` in `InvoiceLineItemRepository` per includere `li.discount_percentage` nel SELECT e nel GROUP BY
- [x] 1.2 Aggiungere i campi `discountPercentage` e `effectiveUnitPrice` al record `PriceListItemDto`
- [x] 1.3 Aggiornare `PriceListController.toDto()` per leggere `discount_percentage` dalla riga e calcolare `effectiveUnitPrice`
- [x] 1.4 Aggiornare o aggiungere test in `PriceListControllerTest` per verificare le righe con sconto, senza sconto, e righe separate per sconti diversi

## 2. Backend — Export Excel

- [x] 2.1 Verificare che la dipendenza Apache POI (`poi-ooxml`) sia già presente in `pom.xml`; aggiungerla se assente
- [x] 2.2 Creare il metodo privato `buildExcel(List<PriceListItemDto>, String supplierName)` in `PriceListController` (o in una classe helper `PriceListExcelExporter`)
- [x] 2.3 Aggiungere endpoint `GET /api/price-lists/supplier/{supplierId}/export-xlsx` in `PriceListController` che recupera nome fornitore, esegue la query e restituisce il file XLSX
- [x] 2.4 Aggiungere test per l'endpoint Excel (verifica Content-Type, Content-Disposition e che il body non sia vuoto; verifica filtro date)

## 3. Backend — Export PDF

- [x] 3.1 Aggiungere la dipendenza OpenPDF (`com.github.librepdf:openpdf`) in `pom.xml`
- [x] 3.2 Creare la classe helper `PriceListPdfExporter` con metodo `buildPdf(List<PriceListItemDto>, String supplierName, String vatNumber, String dateFrom, String dateTo)`
- [x] 3.3 Implementare la generazione PDF: intestazione con nome fornitore, partita IVA e periodo, seguita da tabella prodotti con colonne Descrizione, U.M., Prezzo unitario, Sconto (%), Prezzo effettivo, Ultimo acquisto, Quantità totale
- [x] 3.4 Aggiungere endpoint `GET /api/price-lists/supplier/{supplierId}/export-pdf` in `PriceListController`
- [x] 3.5 Aggiungere test per l'endpoint PDF (verifica Content-Type, Content-Disposition, magic bytes `%PDF`, e presenza nome fornitore nel documento)

## 4. Frontend — Nuove colonne nel listino

- [x] 4.1 Aggiornare il tipo `PriceListItem` in `src/types/invoice.ts` aggiungendo `discountPercentage: number | null` e `effectiveUnitPrice: number | null`
- [x] 4.2 Aggiungere le colonne "Sconto (%)" e "Prezzo effettivo" alle definizioni colonne di `MantineReactTable` in `price-list-page.tsx`
- [x] 4.3 Aggiungere formatter per la percentuale di sconto (es. "15%" oppure "—" se null)
- [x] 4.4 Aggiornare i test di `price-list-page.test.tsx` per verificare che le nuove colonne vengano renderizzate correttamente

## 5. Frontend — Pulsanti di esportazione

- [x] 5.1 Aggiungere la funzione `exportPriceListXlsx(supplierId, from?, to?)` in `src/lib/api/price-lists.ts` (download blob tramite `authFetch`)
- [x] 5.2 Aggiungere la funzione `exportPriceListPdf(supplierId, from?, to?)` in `src/lib/api/price-lists.ts`
- [x] 5.3 Aggiungere i pulsanti "Esporta Excel" e "Esporta PDF" nella toolbar della pagina `price-list-page.tsx`, abilitati solo dopo una ricerca completata (`searched === true`)
- [x] 5.4 Gestire lo stato di loading per entrambi i pulsanti di export e mostrare notifica di errore in caso di fallimento
- [x] 5.5 Aggiornare i test di `price-lists.test.ts` e `price-list-page.test.tsx` per le nuove funzioni e i nuovi pulsanti

## 6. Verifica e documentazione

- [x] 6.1 Eseguire `cd apps/backend && ./mvnw verify` e verificare che tutti i test passino con copertura ≥ 70%
- [x] 6.2 Eseguire `cd apps/frontend && npm run coverage` e verificare che tutti i test passino con copertura ≥ 70%
- [x] 6.3 Eseguire `cd apps/frontend && npm run build` e verificare che il frontend compili senza errori
- [x] 6.4 Aggiornare `AGENTS.md` §2.3 (terminologia), §5.3 (endpoint API) e §1 (feature table) per riflettere le nuove funzionalità
