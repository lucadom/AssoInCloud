package it.assoincloud.backend.controller;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Integration tests for InvoiceController + InvoiceService (full stack with in-memory SQLite).
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
@AutoConfigureMockMvc
@Transactional
@WithMockUser
class InvoiceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // CSV with header + 3 rows
    private static final String CSV_CONTENT =
        "\"Tipo documento\";\"Numero\";\"Data\";\"P.IVA fornitore\";\"Fornitore\";\"Imponibile\";\"IVA\";\"SdI\";\"Stato\"\n" +
        "\"TD01\";\"FT/001/2024\";\"15/01/2024\";\"01234567890\";\"Alfa SRL\";\"1.000,00\";\"220,00\";\"SDI001\";\"Fattura visualizzata\"\n" +
        "\"TD01\";\"FT/002/2024\";\"20/02/2024\";\"09876543210\";\"Beta SpA\";\"500,00\";\"110,00\";\"SDI002\";\"Non visualizzata\"\n" +
        "\"TD04\";\"NC/001/2024\";\"10/03/2024\";\"01234567890\";\"Alfa SRL\";\"200,00\";\"44,00\";\"SDI003\";\"Non visualizzata\"\n";

    private static final String XML_INVOICE =
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
        "<p:FatturaElettronica xmlns:p=\"http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2\">\n" +
        "  <FatturaElettronicaHeader>\n" +
        "    <CedentePrestatore>\n" +
        "      <DatiAnagrafici>\n" +
        "        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>11111111111</IdCodice></IdFiscaleIVA>\n" +
        "        <Anagrafica><Denominazione>Gamma SRL</Denominazione></Anagrafica>\n" +
        "      </DatiAnagrafici>\n" +
        "      <Sede><Indirizzo>Via Verdi 5</Indirizzo><CAP>20100</CAP><Comune>Milano</Comune><Provincia>MI</Provincia></Sede>\n" +
        "    </CedentePrestatore>\n" +
        "  </FatturaElettronicaHeader>\n" +
        "  <FatturaElettronicaBody>\n" +
        "    <DatiGenerali>\n" +
        "      <DatiGeneraliDocumento>\n" +
        "        <TipoDocumento>TD01</TipoDocumento>\n" +
        "        <Divisa>EUR</Divisa>\n" +
        "        <Data>2024-04-10</Data>\n" +
        "        <Numero>FT/XML/001</Numero>\n" +
        "      </DatiGeneraliDocumento>\n" +
        "    </DatiGenerali>\n" +
        "    <DatiBeniServizi>\n" +
        "      <DettaglioLinee>\n" +
        "        <NumeroLinea>1</NumeroLinea>\n" +
        "        <Descrizione>Consulenza tecnica</Descrizione>\n" +
        "        <PrezzoUnitario>800.00</PrezzoUnitario>\n" +
        "        <PrezzoTotale>800.00</PrezzoTotale>\n" +
        "        <AliquotaIVA>22.00</AliquotaIVA>\n" +
        "      </DettaglioLinee>\n" +
        "      <DatiRiepilogo>\n" +
        "        <AliquotaIVA>22.00</AliquotaIVA>\n" +
        "        <ImponibileImporto>800.00</ImponibileImporto>\n" +
        "        <Imposta>176.00</Imposta>\n" +
        "      </DatiRiepilogo>\n" +
        "    </DatiBeniServizi>\n" +
        "  </FatturaElettronicaBody>\n" +
        "</p:FatturaElettronica>";

    @Test
    void listShouldReturnEmptyArrayInitially() throws Exception {
        mockMvc.perform(get("/api/invoices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void createShouldReturnCreatedInvoice() throws Exception {
        String body = """
                {
                  "documentType": "TD01",
                  "invoiceNumber": "FT/001",
                  "date": "2024-05-01",
                  "supplierName": "Test SRL",
                  "supplierVatNumber": "IT99999999999",
                  "taxableAmount": 100.00,
                  "taxAmount": 22.00,
                  "sdiNumber": "X123",
                  "viewed": false
                }""";
        mockMvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.invoiceNumber", is("FT/001")))
                .andExpect(jsonPath("$.documentType", is("TD01")))
                .andExpect(jsonPath("$.supplier.name", is("Test SRL")));
    }

    @Test
    void getShouldReturnInvoiceById() throws Exception {
        String body = """
                {
                  "documentType": "TD01",
                  "invoiceNumber": "FT/GET/001",
                  "date": "2024-05-01",
                  "supplierName": "Get SRL",
                  "supplierVatNumber": "IT88888888888",
                  "taxableAmount": 200.00,
                  "taxAmount": 44.00,
                  "sdiNumber": "",
                  "viewed": true
                }""";
        MvcResult result = mockMvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        String id = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(get("/api/invoices/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.invoiceNumber", is("FT/GET/001")))
                .andExpect(jsonPath("$.viewed", is(true)));
    }

    @Test
    void getShouldReturn400ForUnknownId() throws Exception {
        mockMvc.perform(get("/api/invoices/nonexistent-id"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateShouldModifyInvoice() throws Exception {
        // Create
        String createBody = """
                {
                  "documentType": "TD01",
                  "invoiceNumber": "FT/UPDATE/001",
                  "date": "2024-05-01",
                  "supplierName": "Update SRL",
                  "supplierVatNumber": "IT77777777777",
                  "taxableAmount": 100.00,
                  "taxAmount": 22.00,
                  "sdiNumber": "",
                  "viewed": false
                }""";
        MvcResult result = mockMvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andReturn();
        String id = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        // Update
        String updateBody = createBody.replace("\"viewed\": false", "\"viewed\": true");
        mockMvc.perform(put("/api/invoices/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.viewed", is(true)));
    }

    @Test
    void deleteShouldRemoveInvoice() throws Exception {
        String body = """
                {
                  "documentType": "TD01",
                  "invoiceNumber": "FT/DEL/001",
                  "date": "2024-05-01",
                  "supplierName": "Delete SRL",
                  "supplierVatNumber": "IT66666666666",
                  "taxableAmount": 100.00,
                  "taxAmount": 22.00,
                  "sdiNumber": "",
                  "viewed": false
                }""";
        MvcResult result = mockMvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        String id = objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(delete("/api/invoices/" + id))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/invoices/" + id))
                .andExpect(status().isBadRequest());
    }

    @Test
    void uploadCsvShouldImportRows() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "files", "invoices.csv", "text/csv", CSV_CONTENT.getBytes());

        mockMvc.perform(multipart("/api/invoices/upload/csv").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(3)))
                .andExpect(jsonPath("$.skipped", is(0)));

        mockMvc.perform(get("/api/invoices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)));
    }

    @Test
    void uploadCsvShouldSkipDuplicates() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "files", "invoices.csv", "text/csv", CSV_CONTENT.getBytes());

        // First import
        mockMvc.perform(multipart("/api/invoices/upload/csv").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(3)));

        // Second import with same file — all should be skipped
        mockMvc.perform(multipart("/api/invoices/upload/csv").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(0)))
                .andExpect(jsonPath("$.skipped", is(3)));
    }

    @Test
    void uploadCsvShouldParseViewedFlag() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "files", "invoices.csv", "text/csv", CSV_CONTENT.getBytes());
        mockMvc.perform(multipart("/api/invoices/upload/csv").file(file))
                .andExpect(status().isOk());

        MvcResult result = mockMvc.perform(get("/api/invoices")).andReturn();
        JsonNode invoices = objectMapper.readTree(result.getResponse().getContentAsString());
        boolean foundViewed = false;
        boolean foundNotViewed = false;
        for (JsonNode inv : invoices) {
            if ("FT/001/2024".equals(inv.get("invoiceNumber").asText())) {
                foundViewed = inv.get("viewed").asBoolean();
            }
            if ("FT/002/2024".equals(inv.get("invoiceNumber").asText())) {
                foundNotViewed = !inv.get("viewed").asBoolean();
            }
        }
        // FT/001/2024 is "Fattura visualizzata" -> viewed = true
        assertEquals(true, foundViewed);
        assertEquals(true, foundNotViewed);
    }

    @Test
    void uploadCsvShouldParseItalianDecimalFormat() throws Exception {
        String csv = "\"Tipo\";\"Numero\";\"Data\";\"P.IVA\";\"Fornitore\";\"Imponibile\";\"IVA\";\"SdI\";\"Stato\"\n" +
                     "\"TD01\";\"FT/DEC/001\";\"01/01/2024\";\"IT55555555555\";\"Decimale SRL\";\"1.234,56\";\"271,60\";\"SDI\";\"Non visualizzata\"\n";
        MockMultipartFile file = new MockMultipartFile(
                "files", "decimal.csv", "text/csv", csv.getBytes());
        mockMvc.perform(multipart("/api/invoices/upload/csv").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(1)));

        MvcResult result = mockMvc.perform(get("/api/invoices")).andReturn();
        JsonNode invoices = objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode inv = invoices.get(0);
        // BigDecimal serializes without trailing zeros, compare as double
        org.junit.jupiter.api.Assertions.assertEquals(1234.56, inv.get("taxableAmount").asDouble(), 0.001);
        org.junit.jupiter.api.Assertions.assertEquals(271.60, inv.get("taxAmount").asDouble(), 0.001);
    }

    @Test
    void uploadInvoiceXmlShouldImportInvoice() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "files", "fattura.xml", "application/xml", XML_INVOICE.getBytes());

        mockMvc.perform(multipart("/api/invoices/upload/invoice").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(1)));

        MvcResult result = mockMvc.perform(get("/api/invoices")).andReturn();
        JsonNode invoices = objectMapper.readTree(result.getResponse().getContentAsString());
        assertEquals(1, invoices.size());
        assertEquals("FT/XML/001", invoices.get(0).get("invoiceNumber").asText());
        assertEquals("Gamma SRL", invoices.get(0).get("supplier").get("name").asText());
        assertEquals("11111111111", invoices.get(0).get("supplier").get("vatNumber").asText());
    }

    @Test
    void uploadXmlTwiceShouldUpdateNotDuplicate() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "files", "fattura.xml", "application/xml", XML_INVOICE.getBytes());

        // First import
        mockMvc.perform(multipart("/api/invoices/upload/invoice").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(1)));

        // Second import same XML -> updated = 1
        mockMvc.perform(multipart("/api/invoices/upload/invoice").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(0)))
                .andExpect(jsonPath("$.updated", is(1)));

        // Only 1 invoice in DB
        mockMvc.perform(get("/api/invoices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void updateShouldResolveExistingSupplier() throws Exception {
        // Create two invoices for the same supplier
        String body1 = """
                {
                  "documentType": "TD01",
                  "invoiceNumber": "FT/S/001",
                  "date": "2024-05-01",
                  "supplierName": "Supplier Inc",
                  "supplierVatNumber": "IT11112222333",
                  "taxableAmount": 100.00,
                  "taxAmount": 22.00,
                  "sdiNumber": "",
                  "viewed": false
                }""";
        mockMvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body1))
                .andExpect(status().isCreated());

        String body2 = """
                {
                  "documentType": "TD01",
                  "invoiceNumber": "FT/S/002",
                  "date": "2024-05-02",
                  "supplierName": "Supplier Inc",
                  "supplierVatNumber": "IT11112222333",
                  "taxableAmount": 200.00,
                  "taxAmount": 44.00,
                  "sdiNumber": "",
                  "viewed": false
                }""";
        mockMvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body2))
                .andExpect(status().isCreated());

        // Both invoices share the same supplier
        MvcResult result = mockMvc.perform(get("/api/invoices")).andReturn();
        JsonNode invoices = objectMapper.readTree(result.getResponse().getContentAsString());
        assertEquals(2, invoices.size());
        String suppId0 = invoices.get(0).get("supplier").get("id").asText();
        String suppId1 = invoices.get(1).get("supplier").get("id").asText();
        assertEquals(suppId0, suppId1);
    }

    @Test
    void createShouldAcceptIsodatetimeString() throws Exception {
        // Frontend Date.toISOString() produces "2024-05-01T00:00:00.000Z"
        String body = """
                {
                  "documentType": "TD01",
                  "invoiceNumber": "FT/ISO/001",
                  "date": "2024-05-01T10:30:00.000Z",
                  "supplierName": "ISO SRL",
                  "supplierVatNumber": "IT44444444444",
                  "taxableAmount": 100.00,
                  "taxAmount": 22.00,
                  "sdiNumber": "",
                  "viewed": false
                }""";
        mockMvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.date", is("2024-05-01")));
    }

    @Test
    void createShouldReturn400WhenDateIsMissing() throws Exception {
        String body = """
                {
                  "documentType": "TD01",
                  "invoiceNumber": "FT/NODATE/001",
                  "date": null,
                  "supplierName": "NoDate SRL",
                  "supplierVatNumber": "IT33333333333",
                  "taxableAmount": 100.00,
                  "taxAmount": 22.00,
                  "sdiNumber": "",
                  "viewed": false
                }""";
        mockMvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void uploadCsvShouldHandleEmptyFile() throws Exception {
        String csv = "\"Tipo\";\"Numero\";\"Data\";\"P.IVA\";\"Fornitore\";\"Imponibile\";\"IVA\";\"SdI\";\"Stato\"\n";
        MockMultipartFile file = new MockMultipartFile(
                "files", "empty.csv", "text/csv", csv.getBytes());
        mockMvc.perform(multipart("/api/invoices/upload/csv").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(0)));
    }

    @Test
    void uploadCsvMultipleFilesShouldAggregateResults() throws Exception {
        String csv1 = "\"Tipo\";\"Numero\";\"Data\";\"P.IVA\";\"Fornitore\";\"Imponibile\";\"IVA\";\"SdI\";\"Stato\"\n" +
                      "\"TD01\";\"FT/MF/001\";\"01/01/2024\";\"IT11111111111\";\"SRL A\";\"100,00\";\"22,00\";\"SDI1\";\"Non visualizzata\"\n";
        String csv2 = "\"Tipo\";\"Numero\";\"Data\";\"P.IVA\";\"Fornitore\";\"Imponibile\";\"IVA\";\"SdI\";\"Stato\"\n" +
                      "\"TD01\";\"FT/MF/002\";\"02/01/2024\";\"IT22222222222\";\"SRL B\";\"200,00\";\"44,00\";\"SDI2\";\"Non visualizzata\"\n";
        MockMultipartFile file1 = new MockMultipartFile("files", "a.csv", "text/csv", csv1.getBytes());
        MockMultipartFile file2 = new MockMultipartFile("files", "b.csv", "text/csv", csv2.getBytes());

        mockMvc.perform(multipart("/api/invoices/upload/csv").file(file1).file(file2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(2)));
    }

    @Test
    void downloadAttachmentShouldReturnNotFoundForMissingInvoice() throws Exception {
        mockMvc.perform(get("/api/invoices/nonexistent/attachments/also-nonexistent"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listShouldIncludeSupplierDetails() throws Exception {
        String body = """
                {
                  "documentType": "TD01",
                  "invoiceNumber": "FT/SUPP/001",
                  "date": "2024-05-01",
                  "supplierName": "Supplier Detail SRL",
                  "supplierVatNumber": "IT99998888777",
                  "taxableAmount": 100.00,
                  "taxAmount": 22.00,
                  "sdiNumber": "",
                  "viewed": false
                }""";
        mockMvc.perform(post("/api/invoices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/invoices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].supplier.name", is("Supplier Detail SRL")))
                .andExpect(jsonPath("$[0].supplier.vatNumber", is("IT99998888777")));
    }

    // XML invoice with ImportoTotaleDocumento, an Allegato, and a DettaglioLinee without NumeroLinea
    private static final String XML_WITH_ATTACHMENT =
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
        "<p:FatturaElettronica xmlns:p=\"http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2\">\n" +
        "  <FatturaElettronicaHeader>\n" +
        "    <CedentePrestatore>\n" +
        "      <DatiAnagrafici>\n" +
        "        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>55555555555</IdCodice></IdFiscaleIVA>\n" +
        "        <Anagrafica><Denominazione>AttachCo SRL</Denominazione></Anagrafica>\n" +
        "      </DatiAnagrafici>\n" +
        "    </CedentePrestatore>\n" +
        "  </FatturaElettronicaHeader>\n" +
        "  <FatturaElettronicaBody>\n" +
        "    <DatiGenerali>\n" +
        "      <DatiGeneraliDocumento>\n" +
        "        <TipoDocumento>TD01</TipoDocumento>\n" +
        "        <Divisa>EUR</Divisa>\n" +
        "        <Data>2024-06-01</Data>\n" +
        "        <Numero>FT/ATT/001</Numero>\n" +
        "        <ImportoTotaleDocumento>122.00</ImportoTotaleDocumento>\n" +
        "      </DatiGeneraliDocumento>\n" +
        "    </DatiGenerali>\n" +
        "    <DatiBeniServizi>\n" +
        "      <DettaglioLinee>\n" +
        "        <Descrizione>Servizio senza numero linea</Descrizione>\n" +
        "        <PrezzoUnitario>100.00</PrezzoUnitario>\n" +
        "        <PrezzoTotale>100.00</PrezzoTotale>\n" +
        "        <AliquotaIVA>22.00</AliquotaIVA>\n" +
        "      </DettaglioLinee>\n" +
        "      <DatiRiepilogo>\n" +
        "        <AliquotaIVA>22.00</AliquotaIVA>\n" +
        "        <ImponibileImporto>100.00</ImponibileImporto>\n" +
        "        <Imposta>22.00</Imposta>\n" +
        "      </DatiRiepilogo>\n" +
        "    </DatiBeniServizi>\n" +
        "    <Allegati>\n" +
        "      <NomeAttachment>documento.pdf</NomeAttachment>\n" +
        "      <Attachment>dGVzdA==</Attachment>\n" +
        "    </Allegati>\n" +
        "  </FatturaElettronicaBody>\n" +
        "</p:FatturaElettronica>";

    @Test
    void downloadAttachmentShouldReturnFileContent() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "files", "fattura_att.xml", "application/xml", XML_WITH_ATTACHMENT.getBytes());
        mockMvc.perform(multipart("/api/invoices/upload/invoice").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(1)));

        MvcResult listResult = mockMvc.perform(get("/api/invoices")).andReturn();
        JsonNode invoices = objectMapper.readTree(listResult.getResponse().getContentAsString());
        String invoiceId = invoices.get(0).get("id").asText();
        String attachmentId = invoices.get(0).get("attachments").get(0).get("id").asText();

        MvcResult dlResult = mockMvc.perform(get("/api/invoices/" + invoiceId + "/attachments/" + attachmentId))
                .andExpect(status().isOk())
                .andReturn();
        byte[] content = dlResult.getResponse().getContentAsByteArray();
        assertEquals(4, content.length); // base64 "dGVzdA==" decodes to "test" (4 bytes)
    }

    @Test
    void uploadXmlWithAttachmentTwiceShouldReparentAttachments() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "files", "fattura_att.xml", "application/xml", XML_WITH_ATTACHMENT.getBytes());
        mockMvc.perform(multipart("/api/invoices/upload/invoice").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(1)));
        // Second import triggers the update path (re-parents attachments)
        mockMvc.perform(multipart("/api/invoices/upload/invoice").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updated", is(1)));
    }

    @Test
    void uploadCsvShouldUpdateSupplierNameWhenChanged() throws Exception {
        // First import: supplier "Alfa SRL" for VAT "01234567890"
        String csv1 = "\"Tipo\";\"Numero\";\"Data\";\"P.IVA\";\"Fornitore\";\"Imponibile\";\"IVA\";\"SdI\";\"Stato\"\n" +
                      "\"TD01\";\"FT/N/001\";\"01/01/2024\";\"01234567890\";\"Alfa SRL\";\"100,00\";\"22,00\";\"S1\";\"Non visualizzata\"\n";
        MockMultipartFile file1 = new MockMultipartFile("files", "a.csv", "text/csv", csv1.getBytes());
        mockMvc.perform(multipart("/api/invoices/upload/csv").file(file1)).andExpect(status().isOk());

        // Second import: same VAT but a different supplier name — must update the existing supplier
        String csv2 = "\"Tipo\";\"Numero\";\"Data\";\"P.IVA\";\"Fornitore\";\"Imponibile\";\"IVA\";\"SdI\";\"Stato\"\n" +
                      "\"TD01\";\"FT/N/002\";\"02/01/2024\";\"01234567890\";\"Alfa S.r.l.\";\"200,00\";\"44,00\";\"S2\";\"Non visualizzata\"\n";
        MockMultipartFile file2 = new MockMultipartFile("files", "b.csv", "text/csv", csv2.getBytes());
        mockMvc.perform(multipart("/api/invoices/upload/csv").file(file2)).andExpect(status().isOk());

        mockMvc.perform(get("/api/invoices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.invoiceNumber=='FT/N/002')].supplier.name", hasItem("Alfa S.r.l.")));
    }

    @Test
    void uploadCsvShouldHandleUnquotedValues() throws Exception {
        // CSV with unquoted values (no surrounding quotes) — exercises the else branch of unquote()
        String csv = "Tipo documento;Numero;Data;P.IVA fornitore;Fornitore;Imponibile;IVA;SdI;Stato\n" +
                     "TD01;FT/UQ/001;15/01/2024;44444444444;Unquoted SRL;500,00;110,00;SUQI;Non visualizzata\n";
        MockMultipartFile file = new MockMultipartFile("files", "unquoted.csv", "text/csv", csv.getBytes());
        mockMvc.perform(multipart("/api/invoices/upload/csv").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imported", is(1)));
    }
}
