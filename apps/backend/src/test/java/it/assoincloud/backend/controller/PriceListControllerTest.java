package it.assoincloud.backend.controller;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import it.assoincloud.backend.entity.Invoice;
import it.assoincloud.backend.entity.InvoiceLineItem;
import it.assoincloud.backend.entity.Supplier;
import it.assoincloud.backend.repository.InvoiceRepository;
import it.assoincloud.backend.repository.SupplierRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

/**
 * Integration tests for PriceListController REST endpoint.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
@AutoConfigureMockMvc
@Transactional
@WithMockUser
class PriceListControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    private Supplier supplier;

    @BeforeEach
    void setUp() {
        supplier = new Supplier("Alfa SRL", "IT11111111111");
        supplierRepository.save(supplier);

        // Invoice 1: 2024-03-15
        Invoice inv1 = createInvoice("F001", "2024-03-15", supplier);
        addLineItem(inv1, 1, "Caffè espresso", new BigDecimal("10"), "KG",
                new BigDecimal("5.50"), new BigDecimal("55.00"), null);
        addLineItem(inv1, 2, "Tè verde", new BigDecimal("5"), "KG",
                new BigDecimal("8.00"), new BigDecimal("40.00"), null);
        invoiceRepository.save(inv1);

        // Invoice 2: 2024-06-20 — same product "Caffè espresso" at SAME price, no discount
        Invoice inv2 = createInvoice("F002", "2024-06-20", supplier);
        addLineItem(inv2, 1, "Caffè espresso", new BigDecimal("20"), "KG",
                new BigDecimal("5.50"), new BigDecimal("110.00"), null);
        invoiceRepository.save(inv2);

        // Invoice 3: 2024-09-10 — same product "Caffè espresso" at DIFFERENT price
        Invoice inv3 = createInvoice("F003", "2024-09-10", supplier);
        addLineItem(inv3, 1, "Caffè espresso", new BigDecimal("15"), "KG",
                new BigDecimal("6.00"), new BigDecimal("90.00"), null);
        invoiceRepository.save(inv3);
    }

    @Test
    void shouldReturnDistinctPricesGroupedByDescriptionAndPrice() throws Exception {
        mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId()))
                .andExpect(status().isOk())
                // "Caffè espresso" at 5.50 (last date = 2024-06-20, qty = 30)
                // "Caffè espresso" at 6.00 (last date = 2024-09-10, qty = 15)
                // "Tè verde" at 8.00 (last date = 2024-03-15, qty = 5)
                .andExpect(jsonPath("$", hasSize(3)))
                // Results ordered by description ASC, then last date DESC
                .andExpect(jsonPath("$[0].description", is("Caffè espresso")))
                .andExpect(jsonPath("$[0].unitPrice", is(6.0)))
                .andExpect(jsonPath("$[0].lastPurchaseDate", is("2024-09-10")))
                .andExpect(jsonPath("$[0].totalQuantity", is(15.0)))
                .andExpect(jsonPath("$[1].description", is("Caffè espresso")))
                .andExpect(jsonPath("$[1].unitPrice", is(5.5)))
                .andExpect(jsonPath("$[1].lastPurchaseDate", is("2024-06-20")))
                .andExpect(jsonPath("$[1].totalQuantity", is(30.0)))
                .andExpect(jsonPath("$[2].description", is("Tè verde")))
                .andExpect(jsonPath("$[2].unitPrice", is(8.0)))
                .andExpect(jsonPath("$[2].lastPurchaseDate", is("2024-03-15")))
                .andExpect(jsonPath("$[2].totalQuantity", is(5.0)));
    }

    @Test
    void shouldReturnNullDiscountAndEffectivePriceEqualToUnitPriceWhenNoDiscount() throws Exception {
        mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].discountPercentage", nullValue()))
                .andExpect(jsonPath("$[0].effectiveUnitPrice", is(6.0)));
    }

    @Test
    void shouldReturnSeparateRowsForSameProductWithDifferentDiscounts() throws Exception {
        Invoice inv = createInvoice("F010", "2024-11-01", supplier);
        addLineItem(inv, 1, "Prodotto scontato", new BigDecimal("10"), "PZ",
                new BigDecimal("10.00"), new BigDecimal("90.00"), new BigDecimal("10"));
        addLineItem(inv, 2, "Prodotto scontato", new BigDecimal("5"), "PZ",
                new BigDecimal("10.00"), new BigDecimal("80.00"), new BigDecimal("20"));
        invoiceRepository.save(inv);

        mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId()))
                .andExpect(status().isOk())
                // "Prodotto scontato" at 10.00 with 10% discount AND with 20% discount = 2 rows
                // plus the 3 base rows = 5 total
                .andExpect(jsonPath("$", hasSize(5)));
    }

    @Test
    void shouldComputeEffectiveUnitPriceWithDiscount() throws Exception {
        Invoice inv = createInvoice("F011", "2024-11-01", supplier);
        addLineItem(inv, 1, "Articolo scontato", new BigDecimal("10"), "PZ",
                new BigDecimal("10.00"), new BigDecimal("90.00"), new BigDecimal("20"));
        invoiceRepository.save(inv);

        mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId()))
                .andExpect(status().isOk())
                // Find the row with description "Articolo scontato"
                .andExpect(jsonPath("$[?(@.description=='Articolo scontato')].discountPercentage").value(20.0))
                .andExpect(jsonPath("$[?(@.description=='Articolo scontato')].effectiveUnitPrice").value(8.0));
    }

    @Test
    void shouldTreatNullDiscountAndZeroDiscountAsSeparateRows() throws Exception {
        Invoice inv = createInvoice("F012", "2024-11-05", supplier);
        addLineItem(inv, 1, "Prodotto X", new BigDecimal("5"), "PZ",
                new BigDecimal("10.00"), new BigDecimal("50.00"), null);
        addLineItem(inv, 2, "Prodotto X", new BigDecimal("5"), "PZ",
                new BigDecimal("10.00"), new BigDecimal("50.00"), BigDecimal.ZERO);
        invoiceRepository.save(inv);

        mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId()))
                .andExpect(status().isOk())
                // null discount and 0% discount produce separate rows
                .andExpect(jsonPath("$[?(@.description=='Prodotto X')]", hasSize(2)));
    }

    @Test
    void shouldFilterByDateRange() throws Exception {
        // Only invoices from 2024-04-01 to 2024-07-31
        mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId())
                        .param("from", "2024-04-01")
                        .param("to", "2024-07-31"))
                .andExpect(status().isOk())
                // Only Invoice 2 falls in range: "Caffè espresso" at 5.50
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].description", is("Caffè espresso")))
                .andExpect(jsonPath("$[0].unitPrice", is(5.5)))
                .andExpect(jsonPath("$[0].lastPurchaseDate", is("2024-06-20")))
                .andExpect(jsonPath("$[0].totalQuantity", is(20.0)));
    }

    @Test
    void shouldFilterByFromDateOnly() throws Exception {
        mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId())
                        .param("from", "2024-06-01"))
                .andExpect(status().isOk())
                // Invoice 2 + Invoice 3
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].description", is("Caffè espresso")))
                .andExpect(jsonPath("$[0].unitPrice", is(6.0)))
                .andExpect(jsonPath("$[1].description", is("Caffè espresso")))
                .andExpect(jsonPath("$[1].unitPrice", is(5.5)));
    }

    @Test
    void shouldFilterByToDateOnly() throws Exception {
        mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId())
                        .param("to", "2024-05-01"))
                .andExpect(status().isOk())
                // Only Invoice 1: Caffè + Tè
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void shouldReturnEmptyForUnknownSupplier() throws Exception {
        mockMvc.perform(get("/api/price-lists/supplier/non-existent-id"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void shouldReturnUnitOfMeasure() throws Exception {
        mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].unitOfMeasure", is("KG")));
    }

    @Test
    void shouldHandleNullUnitPrice() throws Exception {
        // Add a line item with null unitPrice
        Invoice inv = createInvoice("F004", "2024-10-01", supplier);
        addLineItem(inv, 1, "Prodotto senza prezzo", new BigDecimal("1"), null,
                null, null, null);
        invoiceRepository.save(inv);

        mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId()))
                .andExpect(status().isOk())
                // Only 3 original items — the one with null price is excluded
                .andExpect(jsonPath("$", hasSize(3)));
    }

    @Test
    void shouldExcludeZeroOrNegativeQuantityAndPrice() throws Exception {
        // Add items with invalid quantity/price
        Invoice inv = createInvoice("F005", "2024-11-01", supplier);
        addLineItem(inv, 1, "Prodotto qty zero", BigDecimal.ZERO, "KG",
                new BigDecimal("5.00"), BigDecimal.ZERO, null);
        addLineItem(inv, 2, "Prodotto qty negativa", new BigDecimal("-10"), "KG",
                new BigDecimal("5.00"), new BigDecimal("-50.00"), null);
        addLineItem(inv, 3, "Prodotto prezzo zero", new BigDecimal("10"), "KG",
                BigDecimal.ZERO, BigDecimal.ZERO, null);
        addLineItem(inv, 4, "Prodotto prezzo negativo", new BigDecimal("10"), "KG",
                new BigDecimal("-5.00"), new BigDecimal("-50.00"), null);
        invoiceRepository.save(inv);

        mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId()))
                .andExpect(status().isOk())
                // Only the 3 original valid items
                .andExpect(jsonPath("$", hasSize(3)));
    }

    @Test
    void exportXlsx_should_returnXlsxWithHeaderAndData() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId() + "/export-xlsx"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(header().string("Content-Disposition",
                        org.hamcrest.Matchers.containsString("attachment")))
                .andExpect(header().string("Content-Disposition",
                        org.hamcrest.Matchers.containsString(".xlsx")))
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(body).isNotEmpty();
        // ZIP magic bytes: PK (0x50 0x4B) — XLSX is a ZIP archive
        assertThat(body[0]).isEqualTo((byte) 0x50);
        assertThat(body[1]).isEqualTo((byte) 0x4B);
    }

    @Test
    void exportXlsx_should_returnEmptyWorkbookWhenNoData() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId() + "/export-xlsx")
                        .param("from", "2099-01-01"))
                .andExpect(status().isOk())
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(body).isNotEmpty();
    }

    @Test
    void exportXlsx_should_filterByDateRange() throws Exception {
        // Only data from 2024-04-01 to 2024-07-31 → 1 item (Invoice 2)
        MvcResult result = mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId() + "/export-xlsx")
                        .param("from", "2024-04-01")
                        .param("to", "2024-07-31"))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(result.getResponse().getContentAsByteArray()).isNotEmpty();
    }

    @Test
    void exportPdf_should_returnPdfWithMagicBytes() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId() + "/export-pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(header().string("Content-Disposition",
                        org.hamcrest.Matchers.containsString("attachment")))
                .andExpect(header().string("Content-Disposition",
                        org.hamcrest.Matchers.containsString(".pdf")))
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(body).isNotEmpty();
        // PDF magic bytes: %PDF
        assertThat(new String(body, 0, 4)).isEqualTo("%PDF");
    }

    @Test
    void exportPdf_should_containSupplierName() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId() + "/export-pdf"))
                .andExpect(status().isOk())
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        String pdfText = extractPdfText(body);
        assertThat(pdfText).contains("Alfa SRL");
    }

    @Test
    void exportPdf_should_showTutteLeDateWhenNoFilter() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/price-lists/supplier/" + supplier.getId() + "/export-pdf"))
                .andExpect(status().isOk())
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        String pdfText = extractPdfText(body);
        assertThat(pdfText).contains("Tutte le date");
    }

    // --- Helper methods ---

    private Invoice createInvoice(String number, String date, Supplier supplier) {
        Invoice inv = new Invoice();
        inv.setInvoiceNumber(number);
        inv.setDate(java.time.LocalDate.parse(date));
        inv.setSupplier(supplier);
        inv.setTaxableAmount(BigDecimal.ZERO);
        inv.setTaxAmount(BigDecimal.ZERO);
        inv.setTotalAmount(BigDecimal.ZERO);
        inv.setViewed(false);
        return inv;
    }

    private static String extractPdfText(byte[] pdfBytes) throws Exception {
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            return new PDFTextStripper().getText(doc);
        }
    }

    private void addLineItem(Invoice inv, int lineNumber, String description,
                             BigDecimal quantity, String uom,
                             BigDecimal unitPrice, BigDecimal totalPrice,
                             BigDecimal discountPercentage) {
        InvoiceLineItem li = new InvoiceLineItem();
        li.setLineNumber(lineNumber);
        li.setDescription(description);
        li.setQuantity(quantity);
        li.setUnitOfMeasure(uom);
        li.setUnitPrice(unitPrice);
        li.setTotalPrice(totalPrice);
        li.setDiscountPercentage(discountPercentage);
        li.setInvoice(inv);
        inv.getLineItems().add(li);
    }
}
