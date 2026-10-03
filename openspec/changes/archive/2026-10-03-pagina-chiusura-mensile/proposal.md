## Why

Le chiusure mensili richiedono di ripetere manualmente gli stessi calcoli, con il rischio di errori e di risultati incoerenti. Una pagina dedicata permette di inserire gli importi e verificare immediatamente i totali e le operazioni che li determinano, senza registrare dati nel database.

## What Changes

- Aggiungere una pagina "Chiusure" con tre gruppi di campi: Incassi (Incasso bar, Incasso tabacchi, POS), Spese (Spese contanti, Spese tabacchi) e Contanti effettivi (quantità di banconote per taglio e totale Spiccioli).
- Calcolare i Contanti effettivi moltiplicando ogni quantità per il relativo taglio e sommando gli spiccioli; i campi contanti vuoti valgono zero, ma almeno uno deve essere valorizzato.
- Calcolare e mostrare in tempo reale Contanti teorici, Differenza contanti, Incasso bar effettivo e Quota banconieri, esplicitando le operazioni e il calcolo percentuale.
- Mostrare un ultimo box con le banconote da consegnare ai banconieri, usando solo i pezzi disponibili e privilegiando i tagli grandi. La quota da consegnare viene arrotondata ai 5 € più vicini (a metà verso l'alto); se non è componibile viene mostrato un avviso senza proporre un totale superiore, insieme a un cambio di taglio di pari valore quando sufficiente a rendere componibile la quota.
- Aggiungere la voce "Chiusure" come penultima voce del menu principale, immediatamente prima di "Impostazioni".
- Mantenere tutti i valori solo nello stato della pagina, senza persistenza nel database o chiamate API.

## Capabilities

### New Capabilities
- `monthly-closing-calculator`: inserimento degli importi della chiusura mensile e visualizzazione in tempo reale dei risultati e dei calcoli.

### Modified Capabilities
- `app-navigation`: la navigazione principale include "Chiusure" prima di "Impostazioni" e consente di aprire e identificare la pagina come attiva.

## Impact

- Frontend: nuova pagina e relativi calcoli; aggiornamento di `app-layout.tsx` e dei test di navigazione.
- OpenSpec: nuova capability per il calcolatore e aggiornamento dei requisiti di navigazione.
- Backend, API e database: nessuna modifica prevista.
