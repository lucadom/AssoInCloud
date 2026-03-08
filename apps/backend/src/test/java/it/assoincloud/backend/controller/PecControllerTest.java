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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for PecController REST endpoints.
 * These tests verify the behaviour when PEC is not configured (empty host).
 * Tests that require a live IMAP server are not included here.
 */
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:sqlite::memory:",
        "spring.jpa.hibernate.ddl-auto=none",
        "assoincloud.pec.host="
})
@AutoConfigureMockMvc
@WithMockUser
class PecControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void listFolders_should_return404_when_notConfigured() throws Exception {
        mockMvc.perform(get("/api/pec/folders"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("Accesso alla casella PEC non configurato")));
    }

    @Test
    void listMessages_should_return404_when_notConfigured() throws Exception {
        mockMvc.perform(get("/api/pec/messages").param("folder", "INBOX"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void getMessage_should_return404_when_notConfigured() throws Exception {
        mockMvc.perform(get("/api/pec/messages/1").param("folder", "INBOX"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void downloadAttachment_should_return404_when_notConfigured() throws Exception {
        mockMvc.perform(get("/api/pec/attachments/1/0").param("folder", "INBOX"))
                .andExpect(status().isNotFound());
    }

    @Test
    void setReadStatus_should_return404_when_notConfigured() throws Exception {
        mockMvc.perform(patch("/api/pec/messages/1")
                        .param("folder", "INBOX")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"read\":true}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void searchMessages_should_return404_when_notConfigured() throws Exception {
        mockMvc.perform(get("/api/pec/messages/search")
                        .param("folder", "INBOX")
                        .param("query", "fattura"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").exists());
    }
}
