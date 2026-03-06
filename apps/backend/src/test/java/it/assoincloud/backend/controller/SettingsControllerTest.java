package it.assoincloud.backend.controller;

import static org.hamcrest.Matchers.is;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for SettingsController REST endpoints.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
@AutoConfigureMockMvc
@Transactional
@WithMockUser
class SettingsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getPecSettingsShouldReturnDefaultsInitially() throws Exception {
        mockMvc.perform(get("/api/settings/pec"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.host", is("")))
                .andExpect(jsonPath("$.port", is(993)))
                .andExpect(jsonPath("$.username", is("")))
                .andExpect(jsonPath("$.ssl", is(true)))
                .andExpect(jsonPath("$.sslTrustAll", is(false)))
                .andExpect(jsonPath("$.passwordSet", is(false)));
    }

    @Test
    void savePecSettingsShouldPersistAndReturn() throws Exception {
        String body = """
                {
                  "host": "imap.pec.example.com",
                  "port": 993,
                  "username": "user@pec.it",
                  "password": "mypassword",
                  "ssl": true,
                  "sslTrustAll": false,
                  "passwordSet": false
                }""";
        mockMvc.perform(put("/api/settings/pec")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.host", is("imap.pec.example.com")))
                .andExpect(jsonPath("$.port", is(993)))
                .andExpect(jsonPath("$.username", is("user@pec.it")))
                .andExpect(jsonPath("$.passwordSet", is(true)))
                .andExpect(jsonPath("$.password", is("")));
    }

    @Test
    void savePecSettingsShouldPreservePasswordWhenBlankSent() throws Exception {
        // First, set a password
        String body1 = """
                {
                  "host": "imap.pec.example.com",
                  "port": 993,
                  "username": "user@pec.it",
                  "password": "original",
                  "ssl": true,
                  "sslTrustAll": false,
                  "passwordSet": false
                }""";
        mockMvc.perform(put("/api/settings/pec")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passwordSet", is(true)));

        // Second save with blank password — should preserve original
        String body2 = """
                {
                  "host": "imap.pec.example.com",
                  "port": 993,
                  "username": "user@pec.it",
                  "password": "",
                  "ssl": true,
                  "sslTrustAll": false,
                  "passwordSet": false
                }""";
        mockMvc.perform(put("/api/settings/pec")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passwordSet", is(true)));
    }

    @Test
    void getPecSettingsShouldNeverReturnPassword() throws Exception {
        String body = """
                {
                  "host": "imap.pec.example.com",
                  "port": 993,
                  "username": "user@pec.it",
                  "password": "secret123",
                  "ssl": true,
                  "sslTrustAll": false,
                  "passwordSet": false
                }""";
        mockMvc.perform(put("/api/settings/pec")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body));

        mockMvc.perform(get("/api/settings/pec"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.password", is("")))
                .andExpect(jsonPath("$.passwordSet", is(true)));
    }

    @Test
    void savePecSettingsShouldStoreSslTrustAllTrue() throws Exception {
        String body = """
                {
                  "host": "imap.legalmail.it",
                  "port": 993,
                  "username": "user@legalmail.it",
                  "password": "pass",
                  "ssl": true,
                  "sslTrustAll": true,
                  "passwordSet": false
                }""";
        mockMvc.perform(put("/api/settings/pec")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sslTrustAll", is(true)));
    }
}
