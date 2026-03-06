package it.assoincloud.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import it.assoincloud.backend.dto.PecSettingsDto;

/**
 * Integration tests for AppSettingService with in-memory SQLite.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
@Transactional
class AppSettingServiceTest {

    @Autowired
    private AppSettingService service;

    @Test
    void getValueShouldReturnEmptyWhenKeyNotPresent() {
        assertTrue(service.getValue("no.such.key").isEmpty());
    }

    @Test
    void setValueShouldStoreAndRetrieveValue() {
        service.setValue("test.key", "test-value");
        assertEquals("test-value", service.getValue("test.key").orElse(null));
    }

    @Test
    void setValueShouldUpdateExistingValue() {
        service.setValue("update.key", "first");
        service.setValue("update.key", "second");
        assertEquals("second", service.getValue("update.key").orElse(null));
    }

    @Test
    void getPecSettingsShouldReturnDefaultsWhenNothingStored() {
        PecSettingsDto dto = service.getPecSettings();
        assertEquals("", dto.host());
        assertEquals(993, dto.port());
        assertEquals("", dto.username());
        assertEquals("", dto.password());
        assertTrue(dto.ssl());
        assertFalse(dto.sslTrustAll());
        assertFalse(dto.passwordSet());
    }

    @Test
    void savePecSettingsShouldPersistAllFields() {
        PecSettingsDto input = new PecSettingsDto("imap.pec.example.com", 993, "user@pec.it",
                "s3cr3t", true, false, false);
        service.savePecSettings(input);

        PecSettingsDto result = service.getPecSettings();
        assertEquals("imap.pec.example.com", result.host());
        assertEquals(993, result.port());
        assertEquals("user@pec.it", result.username());
        assertEquals("", result.password()); // password not returned
        assertTrue(result.passwordSet());
        assertTrue(result.ssl());
        assertFalse(result.sslTrustAll());
    }

    @Test
    void savePecSettingsShouldPreserveExistingPasswordWhenBlankProvided() {
        // Save with a password
        PecSettingsDto initial = new PecSettingsDto("imap.pec.example.com", 993, "user@pec.it",
                "original-password", true, false, false);
        service.savePecSettings(initial);

        // Save again with blank password
        PecSettingsDto update = new PecSettingsDto("imap.pec.example.com", 993, "user@pec.it",
                "", true, false, false);
        service.savePecSettings(update);

        // Password should still be set
        PecSettingsDto result = service.getPecSettings();
        assertTrue(result.passwordSet());
        // Internal password should still be retrievable
        assertEquals("original-password", service.getPecPassword());
    }

    @Test
    void savePecSettingsShouldHandlePortFallbackWhenZero() {
        // port <= 0 defaults to 993
        PecSettingsDto input = new PecSettingsDto("imap.pec.example.com", 0, "user@pec.it",
                "pass", true, false, false);
        service.savePecSettings(input);

        PecSettingsDto result = service.getPecSettings();
        assertEquals(993, result.port());
    }

    @Test
    void getPecSettingsShouldHandleInvalidPortValue() {
        // Store invalid port directly to simulate corrupted data
        service.setValue("pec.port", "not-a-number");
        PecSettingsDto result = service.getPecSettings();
        assertEquals(993, result.port()); // falls back to 993
    }

    @Test
    void savePecSettingsShouldStoreSslTrustAllFlag() {
        PecSettingsDto input = new PecSettingsDto("imap.pec.it", 993, "u", "p", true, true, false);
        service.savePecSettings(input);

        PecSettingsDto result = service.getPecSettings();
        assertTrue(result.sslTrustAll());
    }

    @Test
    void savePecSettingsShouldStoreSslDisabled() {
        PecSettingsDto input = new PecSettingsDto("imap.pec.it", 143, "u", "p", false, false, false);
        service.savePecSettings(input);

        PecSettingsDto result = service.getPecSettings();
        assertFalse(result.ssl());
        assertEquals(143, result.port());
    }

    @Test
    void getPecPasswordShouldReturnEmptyWhenNotSet() {
        assertEquals("", service.getPecPassword());
    }

    @Test
    void savePecSettingsShouldTrimHostAndUsername() {
        PecSettingsDto input = new PecSettingsDto("  imap.pec.example.com  ", 993,
                "  user@pec.it  ", "pass", true, false, false);
        service.savePecSettings(input);

        PecSettingsDto result = service.getPecSettings();
        assertEquals("imap.pec.example.com", result.host());
        assertEquals("user@pec.it", result.username());
    }
}
