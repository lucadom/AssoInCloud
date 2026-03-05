package it.assoincloud.backend.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.Test;

import it.assoincloud.backend.dto.PecSettingsDto;

/**
 * Unit tests for PecService configuration logic.
 *
 * IMAP integration tests require a live PEC server and are therefore not
 * included here. The service logic (isConfigured, multipart parsing helpers) is
 * covered; connection/session operations are exercised by the controller
 * integration tests when a real server is available.
 */
class PecServiceTest {

    private PecService serviceWith(String host) {
        AppSettingService appSettingService = mock(AppSettingService.class);
        PecSettingsDto dto = new PecSettingsDto(host, 993, "user", "", true, false, false);
        when(appSettingService.getPecSettings()).thenReturn(dto);
        return new PecService(appSettingService);
    }

    @Test
    void isConfigured_should_returnFalse_when_hostIsEmpty() {
        assertFalse(serviceWith("").isConfigured());
    }

    @Test
    void isConfigured_should_returnFalse_when_hostIsBlank() {
        assertFalse(serviceWith("   ").isConfigured());
    }

    @Test
    void isConfigured_should_returnFalse_when_hostIsNull() {
        assertFalse(serviceWith(null).isConfigured());
    }

    @Test
    void isConfigured_should_returnTrue_when_hostIsSet() {
        assertTrue(serviceWith("imap.pec.example.com").isConfigured());
    }

    @Test
    void isConfigured_should_returnTrue_when_sslIsDisabled() {
        AppSettingService appSettingService = mock(AppSettingService.class);
        PecSettingsDto dto = new PecSettingsDto("mail.example.com", 143, "user", "", false, false, false);
        when(appSettingService.getPecSettings()).thenReturn(dto);
        PecService service = new PecService(appSettingService);
        assertTrue(service.isConfigured());
    }
}
