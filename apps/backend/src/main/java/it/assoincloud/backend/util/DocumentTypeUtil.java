package it.assoincloud.backend.util;

import java.util.Map;

/**
 * Utility for mapping FatturaPA document type codes (TipoDocumento)
 * to human-readable Italian descriptions.
 */
public final class DocumentTypeUtil {

    private DocumentTypeUtil() {}

    private static final Map<String, String> CODE_TO_DESCRIPTION = Map.ofEntries(
        Map.entry("TD01", "Fattura"),
        Map.entry("TD02", "Acconto/Anticipo su fattura"),
        Map.entry("TD03", "Acconto/Anticipo su parcella"),
        Map.entry("TD04", "Nota di Credito"),
        Map.entry("TD05", "Nota di Debito"),
        Map.entry("TD06", "Parcella"),
        Map.entry("TD16", "Integrazione fattura reverse charge interno"),
        Map.entry("TD17", "Integrazione/autofattura per acquisto servizi dall'estero"),
        Map.entry("TD18", "Integrazione per acquisto di beni intracomunitari"),
        Map.entry("TD19", "Integrazione/autofattura per acquisto di beni ex art.17 c.2 DPR 633/72"),
        Map.entry("TD20", "Autofattura per regolarizzazione e integrazione delle fatture (ex art. 6 c.9-bis d.lgs. 471/97 o art.46 c.5 D.L. 331/93)"),
        Map.entry("TD21", "Autofattura per splafonamento"),
        Map.entry("TD22", "Estrazione beni da Deposito IVA"),
        Map.entry("TD23", "Estrazione beni da Deposito IVA con versamento dell'IVA"),
        Map.entry("TD24", "Fattura differita di cui all'art.21, comma 4, terzo periodo lett. a) DPR 633/72"),
        Map.entry("TD25", "Fattura differita di cui all'art.21, comma 4, terzo periodo lett. b) DPR 633/72"),
        Map.entry("TD26", "Cessione di beni ammortizzabili e per passaggi interni (ex art.36 DPR 633/72)"),
        Map.entry("TD27", "Fattura per autoconsumo o per cessioni gratuite senza rivalsa"),
        Map.entry("TD28", "Acquisti da San Marino con IVA (fattura cartacea)"),
        Map.entry("TD29", "Comunicazione per omessa o irregolare fatturazione (art. 6, comma 8, D.Lgs. 471/97)")
    );

    /** Credit note document type code */
    public static final String CREDIT_NOTE_CODE = "TD04";

    /**
     * Returns the Italian description for a FatturaPA document type code.
     * If the value is already a description (not a TDxx code), it is returned as-is.
     * Returns an empty string for null/blank input.
     */
    public static String getDescription(String documentType) {
        if (documentType == null || documentType.isBlank()) {
            return "";
        }
        String trimmed = documentType.trim().toUpperCase();
        String description = CODE_TO_DESCRIPTION.get(trimmed);
        if (description != null) {
            return description;
        }
        // Not a known code — return the original value as-is (e.g. from CSV import)
        return documentType;
    }

    /**
     * Returns true if the document type represents a credit note (TD04 or the Italian label).
     */
    public static boolean isCreditNote(String documentType) {
        if (documentType == null || documentType.isBlank()) {
            return false;
        }
        String trimmed = documentType.trim();
        return CREDIT_NOTE_CODE.equalsIgnoreCase(trimmed)
                || "Nota di credito".equalsIgnoreCase(trimmed)
                || "Nota di Credito".equalsIgnoreCase(trimmed);
    }
}
