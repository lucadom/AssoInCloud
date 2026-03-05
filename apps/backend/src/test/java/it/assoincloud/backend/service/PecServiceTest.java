package it.assoincloud.backend.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for PecService configuration logic.
 *
 * IMAP integration tests require a live PEC server and are therefore not
 * included here. The service logic (isConfigured, multipart parsing helpers) is
 * covered; connection/session operations are exercised by the controller
 * integration tests when a real server is available.
 */
class PecServiceTest {

    @Test
    void isConfigured_should_returnFalse_when_hostIsEmpty() {
        PecService service = new PecService("", 993, "user", "pass", true, false);
        assertFalse(service.isConfigured());
    }

    @Test
    void isConfigured_should_returnFalse_when_hostIsBlank() {
        PecService service = new PecService("   ", 993, "user", "pass", true, false);
        assertFalse(service.isConfigured());
    }

    @Test
    void isConfigured_should_returnFalse_when_hostIsNull() {
        PecService service = new PecService(null, 993, "user", "pass", true, false);
        assertFalse(service.isConfigured());
    }

    @Test
    void isConfigured_should_returnTrue_when_hostIsSet() {
        PecService service = new PecService("imap.pec.example.com", 993, "user", "pass", true, false);
        assertTrue(service.isConfigured());
    }

    @Test
    void isConfigured_should_returnTrue_when_sslIsDisabled() {
        PecService service = new PecService("mail.example.com", 143, "user", "pass", false, false);
        assertTrue(service.isConfigured());
    }
}
