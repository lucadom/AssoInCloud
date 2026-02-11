package it.assoincloud.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

/**
 * Tests that when no password is configured, all endpoints are accessible
 * without authentication.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none",
    "assoincloud.password="
})
@AutoConfigureMockMvc
@Transactional
class AuthDisabledTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void statusShouldReportAuthDisabled() throws Exception {
        mockMvc.perform(get("/api/auth/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authEnabled").value(false));
    }

    @Test
    void protectedEndpointShouldBeAccessibleWithoutToken() throws Exception {
        mockMvc.perform(get("/api/invoices"))
                .andExpect(status().isOk());
    }
}
