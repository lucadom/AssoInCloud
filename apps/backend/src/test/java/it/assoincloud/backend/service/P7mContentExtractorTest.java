package it.assoincloud.backend.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for P7mContentExtractor utility class.
 */
class P7mContentExtractorTest {

    @Test
    void isP7mFile_should_returnTrue_when_extensionIsLowerCaseP7m() {
        assertTrue(P7mContentExtractor.isP7mFile("invoice.p7m"));
    }

    @Test
    void isP7mFile_should_returnTrue_when_extensionIsUpperCaseP7M() {
        assertTrue(P7mContentExtractor.isP7mFile("invoice.P7M"));
    }

    @Test
    void isP7mFile_should_returnTrue_when_extensionIsMixedCase() {
        assertTrue(P7mContentExtractor.isP7mFile("FT_001_2024.P7m"));
    }

    @Test
    void isP7mFile_should_returnFalse_when_extensionIsXml() {
        assertFalse(P7mContentExtractor.isP7mFile("invoice.xml"));
    }

    @Test
    void isP7mFile_should_returnFalse_when_fileNameIsNull() {
        assertFalse(P7mContentExtractor.isP7mFile(null));
    }

    @Test
    void isP7mFile_should_returnFalse_when_fileNameHasNoExtension() {
        assertFalse(P7mContentExtractor.isP7mFile("invoicefile"));
    }

    @Test
    void isP7mFile_should_returnFalse_when_fileNameEndsWithP7mInMiddle() {
        // ".p7m" must be the final extension
        assertFalse(P7mContentExtractor.isP7mFile("invoice.p7m.zip"));
    }

    @Test
    void extractContent_should_throwRuntimeException_when_bytesAreNotValidP7m() {
        byte[] invalidBytes = "this is not a P7M file".getBytes();
        assertThrows(RuntimeException.class, () -> P7mContentExtractor.extractContent(invalidBytes));
    }
}
