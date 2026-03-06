package it.assoincloud.backend.controller;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import it.assoincloud.backend.entity.Invoice;
import it.assoincloud.backend.entity.InvoiceLineItem;
import it.assoincloud.backend.entity.Supplier;
import it.assoincloud.backend.repository.InvoiceRepository;
import it.assoincloud.backend.repository.SupplierRepository;

/**
 * Integration tests for ProductController REST endpoints.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
@AutoConfigureMockMvc
@Transactional
@WithMockUser
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @BeforeEach
    void setUp() {
        // Create a supplier and two invoices with line items
        Supplier supplier = supplierRepository.save(new Supplier("Alfa SRL", "IT12345678901"));

        Invoice inv1 = new Invoice();
        inv1.setInvoiceNumber("FT/1/2024");
        inv1.setDate(LocalDate.of(2024, 1, 15));
        inv1.setSupplier(supplier);
        inv1.setTaxableAmount(BigDecimal.valueOf(1000));
        inv1.setTaxAmount(BigDecimal.valueOf(220));
        inv1.setTotalAmount(BigDecimal.valueOf(1220));
        inv1.setDocumentType("TD01");

        InvoiceLineItem item1 = new InvoiceLineItem();
        item1.setInvoice(inv1);
        item1.setLineNumber(1);
        item1.setDescription("Caffè espresso arabica");
        item1.setQuantity(BigDecimal.valueOf(10));
        item1.setUnitOfMeasure("KG");
        item1.setUnitPrice(BigDecimal.valueOf(5.5));
        item1.setTotalPrice(BigDecimal.valueOf(55));
        inv1.getLineItems().add(item1);

        InvoiceLineItem item2 = new InvoiceLineItem();
        item2.setInvoice(inv1);
        item2.setLineNumber(2);
        item2.setDescription("Tè verde biologico");
        item2.setQuantity(BigDecimal.valueOf(5));
        item2.setUnitOfMeasure("KG");
        item2.setUnitPrice(BigDecimal.valueOf(8.0));
        item2.setTotalPrice(BigDecimal.valueOf(40));
        inv1.getLineItems().add(item2);

        invoiceRepository.save(inv1);

        Invoice inv2 = new Invoice();
        inv2.setInvoiceNumber("FT/2/2024");
        inv2.setDate(LocalDate.of(2024, 2, 20));
        inv2.setSupplier(supplier);
        inv2.setTaxableAmount(BigDecimal.valueOf(500));
        inv2.setTaxAmount(BigDecimal.valueOf(110));
        inv2.setTotalAmount(BigDecimal.valueOf(610));
        inv2.setDocumentType("TD01");

        InvoiceLineItem item3 = new InvoiceLineItem();
        item3.setInvoice(inv2);
        item3.setLineNumber(1);
        item3.setDescription("Zucchero di canna");
        item3.setQuantity(BigDecimal.valueOf(20));
        item3.setUnitOfMeasure("KG");
        item3.setUnitPrice(BigDecimal.valueOf(2.5));
        item3.setTotalPrice(BigDecimal.valueOf(50));
        inv2.getLineItems().add(item3);

        invoiceRepository.save(inv2);
    }

    @Test
    void searchShouldReturnMatchingItems() throws Exception {
        mockMvc.perform(get("/api/products/search").param("q", "caffè"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].description", is("Caffè espresso arabica")));
    }

    @Test
    void searchShouldReturnMultipleMatchingItems() throws Exception {
        // "er" matches both "verde" (Tè verde biologico) and "Zucchero"
        mockMvc.perform(get("/api/products/search").param("q", "er"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void searchShouldReturnEmptyForNoMatch() throws Exception {
        mockMvc.perform(get("/api/products/search").param("q", "xyznomatch"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void searchShouldReturnEmptyForBlankQuery() throws Exception {
        mockMvc.perform(get("/api/products/search").param("q", "   "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void searchShouldIncludeSupplierAndDateFields() throws Exception {
        mockMvc.perform(get("/api/products/search").param("q", "caffè"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].supplierName", is("Alfa SRL")))
                .andExpect(jsonPath("$[0].invoiceDate", is("2024-01-15")))
                .andExpect(jsonPath("$[0].unitOfMeasure", is("KG")));
    }

    @Test
    void searchShouldSupportWildcardAsterisk() throws Exception {
        // "caffè*arabica" should match "Caffè espresso arabica"
        mockMvc.perform(get("/api/products/search").param("q", "caffè*arabica"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void buildLikePatternShouldWrapInPercent() {
        assertEquals("%caffè%", ProductController.buildLikePattern("caffè"));
    }

    @Test
    void buildLikePatternShouldConvertAsteriskToPercent() {
        assertEquals("%the%limone%", ProductController.buildLikePattern("the*limone"));
    }

    @Test
    void buildLikePatternShouldEscapeSqlWildcards() {
        assertEquals("%100\\%\\_%", ProductController.buildLikePattern("100%_"));
    }

    private void assertEquals(String expected, String actual) {
        org.junit.jupiter.api.Assertions.assertEquals(expected, actual);
    }
}
