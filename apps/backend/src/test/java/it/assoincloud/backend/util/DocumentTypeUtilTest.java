package it.assoincloud.backend.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

class DocumentTypeUtilTest {

    @Test
    void getDescription_shouldReturnDescriptionForKnownCodes() {
        assertEquals("Fattura", DocumentTypeUtil.getDescription("TD01"));
        assertEquals("Nota di Credito", DocumentTypeUtil.getDescription("TD04"));
        assertEquals("Parcella", DocumentTypeUtil.getDescription("TD06"));
        assertEquals("Fattura differita di cui all'art.21, comma 4, terzo periodo lett. a) DPR 633/72",
                DocumentTypeUtil.getDescription("TD24"));
    }

    @Test
    void getDescription_shouldBeCaseInsensitive() {
        assertEquals("Fattura", DocumentTypeUtil.getDescription("td01"));
        assertEquals("Nota di Credito", DocumentTypeUtil.getDescription("Td04"));
    }

    @Test
    void getDescription_shouldReturnOriginalValueForUnknownCodes() {
        assertEquals("Nota di credito", DocumentTypeUtil.getDescription("Nota di credito"));
        assertEquals("Fattura", DocumentTypeUtil.getDescription("Fattura"));
        assertEquals("Unknown Type", DocumentTypeUtil.getDescription("Unknown Type"));
    }

    @Test
    void getDescription_shouldReturnEmptyStringForNullOrBlank() {
        assertEquals("", DocumentTypeUtil.getDescription(null));
        assertEquals("", DocumentTypeUtil.getDescription(""));
        assertEquals("", DocumentTypeUtil.getDescription("   "));
    }

    @Test
    void isCreditNote_shouldReturnTrueForTD04() {
        assertTrue(DocumentTypeUtil.isCreditNote("TD04"));
        assertTrue(DocumentTypeUtil.isCreditNote("td04"));
        assertTrue(DocumentTypeUtil.isCreditNote("Td04"));
    }

    @Test
    void isCreditNote_shouldReturnTrueForItalianLabel() {
        assertTrue(DocumentTypeUtil.isCreditNote("Nota di credito"));
        assertTrue(DocumentTypeUtil.isCreditNote("Nota di Credito"));
    }

    @Test
    void isCreditNote_shouldReturnFalseForOtherTypes() {
        assertFalse(DocumentTypeUtil.isCreditNote("TD01"));
        assertFalse(DocumentTypeUtil.isCreditNote("Fattura"));
        assertFalse(DocumentTypeUtil.isCreditNote(null));
        assertFalse(DocumentTypeUtil.isCreditNote(""));
    }

    @Test
    void getDescription_shouldCoverAllDefinedCodes() {
        // Verify all known codes return non-empty descriptions
        String[] codes = {
            "TD01", "TD02", "TD03", "TD04", "TD05", "TD06",
            "TD16", "TD17", "TD18", "TD19", "TD20", "TD21",
            "TD22", "TD23", "TD24", "TD25", "TD26", "TD27",
            "TD28", "TD29"
        };
        for (String code : codes) {
            String desc = DocumentTypeUtil.getDescription(code);
            assertFalse(desc.isEmpty(), "Description should not be empty for " + code);
            assertFalse(desc.equals(code), "Description should differ from code for " + code);
        }
    }
}
