package it.assoincloud.backend.exception;

import static org.hamcrest.Matchers.is;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for GlobalExceptionHandler — exercised by hitting endpoints
 * that raise the relevant exceptions.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
@AutoConfigureMockMvc
@Transactional
@WithMockUser
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldReturn400ForIllegalArgumentException() throws Exception {
        // GET a non-existent invoice triggers IllegalArgumentException in InvoiceService
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/invoices/bad-id"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void shouldReturn400ForDuplicateMemberFiscalCode() throws Exception {
        // Create a member
        String body1 = """
                {
                  "lastName": "Rossi",
                  "firstName": "Mario",
                  "fiscalCode": "RSSMRA80A01H501U",
                  "birthDate": "1980-01-01",
                  "birthPlace": "Roma",
                  "membershipDate": "2024-01-01"
                }""";
        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body1))
                .andExpect(status().isCreated());

        // Creating a second member with the same fiscal code triggers DataIntegrityViolationException
        mockMvc.perform(post("/api/members")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Socio già esistente")));
    }

    @Test
    void illegalArgumentExceptionHandlerShouldReturnErrorMessage() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        var response = handler.handleIllegalArgumentException(new IllegalArgumentException("test error"));
        org.junit.jupiter.api.Assertions.assertEquals(400, response.getStatusCode().value());
        org.junit.jupiter.api.Assertions.assertTrue(response.getBody().toString().contains("test error"));
    }

    @Test
    void dataIntegrityViolationHandlerShouldReturn500ForUnknownConstraint() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        var ex = new DataIntegrityViolationException("UNIQUE constraint failed: some_other_table.col");
        var response = handler.handleDataIntegrityViolation(ex);
        org.junit.jupiter.api.Assertions.assertEquals(500, response.getStatusCode().value());
    }

    @Test
    void dataIntegrityViolationHandlerShouldReturn400ForMemberFiscalCode() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        var ex = new DataIntegrityViolationException("UNIQUE constraint failed: members.fiscal_code");
        var response = handler.handleDataIntegrityViolation(ex);
        org.junit.jupiter.api.Assertions.assertEquals(400, response.getStatusCode().value());
        org.junit.jupiter.api.Assertions.assertTrue(response.getBody().toString().contains("Socio già esistente"));
    }

    @Test
    void dataIntegrityViolationHandlerShouldHandleNullMessage() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();
        // Exception with a cause that has the message
        RuntimeException cause = new RuntimeException("UNIQUE constraint failed: members.fiscal_code");
        DataIntegrityViolationException ex = new DataIntegrityViolationException(null, cause);
        var response = handler.handleDataIntegrityViolation(ex);
        org.junit.jupiter.api.Assertions.assertEquals(400, response.getStatusCode().value());
    }
}
