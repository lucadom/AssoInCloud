package it.assoincloud.backend.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Integration tests for SupplierController REST endpoints.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
@AutoConfigureMockMvc
@Transactional
@WithMockUser
class SupplierControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void listShouldReturnEmptyArrayWhenNoSuppliers() throws Exception {
        mockMvc.perform(get("/api/suppliers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void createShouldReturnCreatedSupplier() throws Exception {
        mockMvc.perform(post("/api/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test SRL\",\"vatNumber\":\"IT12345678901\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Test SRL")))
                .andExpect(jsonPath("$.vatNumber", is("IT12345678901")))
                .andExpect(jsonPath("$.invoiceCount", is(0)))
                .andExpect(jsonPath("$.paymentMethod").doesNotExist());
    }

    @Test
    void createShouldAcceptPaymentMethod() throws Exception {
        mockMvc.perform(post("/api/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Bonifico SRL\",\"vatNumber\":\"IT10101010101\",\"paymentMethod\":\"BANK_TRANSFER\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentMethod", is("BANK_TRANSFER")));
    }

    @Test
    void updateShouldModifyPaymentMethod() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"PM Test\",\"vatNumber\":\"IT20202020202\",\"paymentMethod\":\"CASH\"}"))
                .andExpect(status().isCreated())
                .andReturn();

        String id = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(put("/api/suppliers/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"PM Test\",\"vatNumber\":\"IT20202020202\",\"paymentMethod\":\"DIRECT_DEBIT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentMethod", is("DIRECT_DEBIT")));
    }

    @Test
    void autoCreatedSupplierFromInvoiceShouldHaveNullPaymentMethod() throws Exception {
        String invoiceJson = """
                {
                    "documentType": "Fattura",
                    "invoiceNumber": "PM-AUTO/2024",
                    "date": "2024-06-15",
                    "supplierName": "Auto Supplier SRL",
                    "supplierVatNumber": "IT30303030303",
                    "taxableAmount": 100,
                    "taxAmount": 22,
                    "sdiNumber": "",
                    "viewed": false
                }
                """;
        mockMvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invoiceJson))
                .andExpect(status().isCreated());

        MvcResult listResult = mockMvc.perform(get("/api/suppliers"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode suppliers = objectMapper.readTree(listResult.getResponse().getContentAsString());
        JsonNode autoCreated = null;
        for (JsonNode node : suppliers) {
            if ("IT30303030303".equals(node.get("vatNumber").asText())) {
                autoCreated = node;
                break;
            }
        }
        assert autoCreated != null : "Fornitore auto-creato non trovato";
        assert autoCreated.get("paymentMethod").isNull() : "paymentMethod dovrebbe essere null per fornitore auto-creato";
    }

    @Test
    void listShouldReturnCreatedSuppliers() throws Exception {
        mockMvc.perform(post("/api/suppliers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Supplier A\",\"vatNumber\":\"IT11111111111\"}"));

        mockMvc.perform(post("/api/suppliers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Supplier B\",\"vatNumber\":\"IT22222222222\"}"));

        mockMvc.perform(get("/api/suppliers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void getShouldReturnSupplierById() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Get Test\",\"vatNumber\":\"IT33333333333\"}"))
                .andExpect(status().isCreated())
                .andReturn();

        String id = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(get("/api/suppliers/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Get Test")))
                .andExpect(jsonPath("$.vatNumber", is("IT33333333333")));
    }

    @Test
    void updateShouldModifySupplier() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Old Name\",\"vatNumber\":\"IT44444444444\"}"))
                .andExpect(status().isCreated())
                .andReturn();

        String id = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(put("/api/suppliers/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"New Name\",\"vatNumber\":\"IT44444444444\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("New Name")));
    }

    @Test
    void createShouldRejectDuplicateVatNumber() throws Exception {
        mockMvc.perform(post("/api/suppliers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"First\",\"vatNumber\":\"IT55555555555\"}"));

        mockMvc.perform(post("/api/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Second\",\"vatNumber\":\"IT55555555555\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void deleteShouldRemoveSupplier() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"To Delete\",\"vatNumber\":\"IT66666666666\"}"))
                .andExpect(status().isCreated())
                .andReturn();

        String id = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(delete("/api/suppliers/" + id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/suppliers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void deleteShouldReturn409WhenSupplierHasInvoices() throws Exception {
        // Create a supplier via the invoice endpoint (which auto-creates the supplier)
        String invoiceJson = """
                {
                    "documentType": "Fattura",
                    "invoiceNumber": "1/2024",
                    "date": "2024-06-15",
                    "supplierName": "Conflict SRL",
                    "supplierVatNumber": "IT99999999999",
                    "taxableAmount": 100,
                    "taxAmount": 22,
                    "sdiNumber": "",
                    "viewed": false
                }
                """;
        mockMvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invoiceJson))
                .andExpect(status().isCreated());

        // Get the suppliers
        MvcResult listResult = mockMvc.perform(get("/api/suppliers"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode suppliers = objectMapper.readTree(listResult.getResponse().getContentAsString());
        String supplierId = suppliers.get(0).get("id").asText();

        // Should return 409 Conflict
        mockMvc.perform(delete("/api/suppliers/" + supplierId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void updateShouldRejectDuplicateVatNumberFromOtherSupplier() throws Exception {
        mockMvc.perform(post("/api/suppliers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"First\",\"vatNumber\":\"IT77777777777\"}"));

        MvcResult result = mockMvc.perform(post("/api/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Second\",\"vatNumber\":\"IT88888888888\"}"))
                .andExpect(status().isCreated())
                .andReturn();

        String secondId = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        // Try to change second supplier's VAT to the first's
        mockMvc.perform(put("/api/suppliers/" + secondId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Second\",\"vatNumber\":\"IT77777777777\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }
}
