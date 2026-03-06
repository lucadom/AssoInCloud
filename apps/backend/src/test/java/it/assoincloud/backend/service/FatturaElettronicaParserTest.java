package it.assoincloud.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import it.assoincloud.backend.entity.Invoice;
import it.assoincloud.backend.entity.Supplier;
import it.assoincloud.backend.repository.SupplierRepository;

@ExtendWith(MockitoExtension.class)
class FatturaElettronicaParserTest {

    @Mock
    private SupplierRepository supplierRepository;

    private FatturaElettronicaParser parser;

    @BeforeEach
    void setUp() {
        parser = new FatturaElettronicaParser(supplierRepository);
    }

    private static String minimalXml(String vatNumber, String supplierName,
                                     String docType, String date, String number,
                                     String taxable, String tax) {
        return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
               "<p:FatturaElettronica xmlns:p=\"http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2\">\n" +
               "  <FatturaElettronicaHeader>\n" +
               "    <CedentePrestatore>\n" +
               "      <DatiAnagrafici>\n" +
               "        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>" + vatNumber + "</IdCodice></IdFiscaleIVA>\n" +
               "        <Anagrafica><Denominazione>" + supplierName + "</Denominazione></Anagrafica>\n" +
               "      </DatiAnagrafici>\n" +
               "      <Sede><Indirizzo>Via Roma 1</Indirizzo><CAP>00100</CAP><Comune>Roma</Comune><Provincia>RM</Provincia></Sede>\n" +
               "    </CedentePrestatore>\n" +
               "  </FatturaElettronicaHeader>\n" +
               "  <FatturaElettronicaBody>\n" +
               "    <DatiGenerali>\n" +
               "      <DatiGeneraliDocumento>\n" +
               "        <TipoDocumento>" + docType + "</TipoDocumento>\n" +
               "        <Divisa>EUR</Divisa>\n" +
               "        <Data>" + date + "</Data>\n" +
               "        <Numero>" + number + "</Numero>\n" +
               "      </DatiGeneraliDocumento>\n" +
               "    </DatiGenerali>\n" +
               "    <DatiBeniServizi>\n" +
               "      <DettaglioLinee>\n" +
               "        <NumeroLinea>1</NumeroLinea>\n" +
               "        <Descrizione>Servizio consulenza</Descrizione>\n" +
               "        <Quantita>1.00</Quantita>\n" +
               "        <UnitaMisura>PZ</UnitaMisura>\n" +
               "        <PrezzoUnitario>" + taxable + "</PrezzoUnitario>\n" +
               "        <PrezzoTotale>" + taxable + "</PrezzoTotale>\n" +
               "        <AliquotaIVA>22.00</AliquotaIVA>\n" +
               "      </DettaglioLinee>\n" +
               "      <DatiRiepilogo>\n" +
               "        <AliquotaIVA>22.00</AliquotaIVA>\n" +
               "        <ImponibileImporto>" + taxable + "</ImponibileImporto>\n" +
               "        <Imposta>" + tax + "</Imposta>\n" +
               "      </DatiRiepilogo>\n" +
               "    </DatiBeniServizi>\n" +
               "    <DatiPagamento>\n" +
               "      <DettaglioPagamento>\n" +
               "        <ModalitaPagamento>MP05</ModalitaPagamento>\n" +
               "        <DataScadenzaPagamento>2024-03-31</DataScadenzaPagamento>\n" +
               "        <ImportoPagamento>1220.00</ImportoPagamento>\n" +
               "        <IBAN>IT60X0542811101000000123456</IBAN>\n" +
               "      </DettaglioPagamento>\n" +
               "    </DatiPagamento>\n" +
               "  </FatturaElettronicaBody>\n" +
               "</p:FatturaElettronica>";
    }

    @Test
    void parseShouldExtractSupplierAndCreateIfNotExists() throws Exception {
        when(supplierRepository.findByVatNumber("01234567890")).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        String xml = minimalXml("01234567890", "Alfa SRL", "TD01", "2024-01-15", "FT/1/2024", "1000.00", "220.00");
        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "test.xml");

        assertNotNull(invoice.getSupplier());
        assertEquals("01234567890", invoice.getSupplier().getVatNumber());
        assertEquals("Alfa SRL", invoice.getSupplier().getName());
    }

    @Test
    void parseShouldReuseExistingSupplier() throws Exception {
        Supplier existing = new Supplier("Old Name", "01234567890");
        when(supplierRepository.findByVatNumber("01234567890")).thenReturn(Optional.of(existing));
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        String xml = minimalXml("01234567890", "New Name SRL", "TD01", "2024-01-15", "FT/1/2024", "1000.00", "220.00");
        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "test.xml");

        assertNotNull(invoice.getSupplier());
        assertEquals("New Name SRL", invoice.getSupplier().getName());
    }

    @Test
    void parseShouldNotUpdateSupplierNameIfUnchanged() throws Exception {
        Supplier existing = new Supplier("Alfa SRL", "01234567890");
        when(supplierRepository.findByVatNumber("01234567890")).thenReturn(Optional.of(existing));

        String xml = minimalXml("01234567890", "Alfa SRL", "TD01", "2024-01-15", "FT/1/2024", "1000.00", "220.00");
        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "test.xml");

        assertEquals("Alfa SRL", invoice.getSupplier().getName());
    }

    @Test
    void parseShouldExtractDatiGenerali() throws Exception {
        when(supplierRepository.findByVatNumber(any())).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        String xml = minimalXml("01234567890", "Alfa SRL", "TD01", "2024-06-15", "FT/42/2024", "500.00", "110.00");
        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "test.xml");

        assertEquals("TD01", invoice.getDocumentType());
        assertEquals("FT/42/2024", invoice.getInvoiceNumber());
        assertEquals(2024, invoice.getDate().getYear());
        assertEquals(6, invoice.getDate().getMonthValue());
        assertEquals(15, invoice.getDate().getDayOfMonth());
        assertEquals("EUR", invoice.getCurrency());
        assertEquals("test.xml", invoice.getFileName());
    }

    @Test
    void parseShouldExtractLineItems() throws Exception {
        when(supplierRepository.findByVatNumber(any())).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        String xml = minimalXml("01234567890", "Alfa SRL", "TD01", "2024-01-15", "FT/1/2024", "1000.00", "220.00");
        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "test.xml");

        assertEquals(1, invoice.getLineItems().size());
        var item = invoice.getLineItems().get(0);
        assertEquals("Servizio consulenza", item.getDescription());
        assertEquals(0, new BigDecimal("1.00").compareTo(item.getQuantity()));
        assertEquals("PZ", item.getUnitOfMeasure());
        assertEquals(0, new BigDecimal("1000.00").compareTo(item.getUnitPrice()));
    }

    @Test
    void parseShouldExtractTaxSummary() throws Exception {
        when(supplierRepository.findByVatNumber(any())).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        String xml = minimalXml("01234567890", "Alfa SRL", "TD01", "2024-01-15", "FT/1/2024", "1000.00", "220.00");
        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "test.xml");

        assertEquals(0, new BigDecimal("1000.00").compareTo(invoice.getTaxableAmount()));
        assertEquals(0, new BigDecimal("220.00").compareTo(invoice.getTaxAmount()));
    }

    @Test
    void parseShouldExtractPaymentData() throws Exception {
        when(supplierRepository.findByVatNumber(any())).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        String xml = minimalXml("01234567890", "Alfa SRL", "TD01", "2024-01-15", "FT/1/2024", "1000.00", "220.00");
        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "test.xml");

        assertEquals("MP05", invoice.getPaymentMethod());
        assertEquals("2024-03-31", invoice.getPaymentDueDate());
        assertEquals("IT60X0542811101000000123456", invoice.getIban());
        assertEquals(0, new BigDecimal("1220.00").compareTo(invoice.getPaymentAmount()));
    }

    @Test
    void parseShouldExtractSupplierAddress() throws Exception {
        when(supplierRepository.findByVatNumber(any())).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        String xml = minimalXml("01234567890", "Alfa SRL", "TD01", "2024-01-15", "FT/1/2024", "1000.00", "220.00");
        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "test.xml");

        assertEquals("Via Roma 1", invoice.getSupplierAddress());
        assertEquals("00100", invoice.getSupplierCap());
        assertEquals("Roma", invoice.getSupplierCity());
        assertEquals("RM", invoice.getSupplierProvince());
    }

    @Test
    void parseShouldExtractAttachments() throws Exception {
        when(supplierRepository.findByVatNumber(any())).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        // "SGVsbG8=" is Base64 for "Hello"
        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                     "<p:FatturaElettronica xmlns:p=\"http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2\">\n" +
                     "  <FatturaElettronicaHeader>\n" +
                     "    <CedentePrestatore>\n" +
                     "      <DatiAnagrafici>\n" +
                     "        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>01234567890</IdCodice></IdFiscaleIVA>\n" +
                     "        <Anagrafica><Denominazione>Alfa SRL</Denominazione></Anagrafica>\n" +
                     "      </DatiAnagrafici>\n" +
                     "      <Sede><Indirizzo>Via Roma 1</Indirizzo><CAP>00100</CAP><Comune>Roma</Comune></Sede>\n" +
                     "    </CedentePrestatore>\n" +
                     "  </FatturaElettronicaHeader>\n" +
                     "  <FatturaElettronicaBody>\n" +
                     "    <DatiGenerali>\n" +
                     "      <DatiGeneraliDocumento>\n" +
                     "        <TipoDocumento>TD01</TipoDocumento><Divisa>EUR</Divisa>\n" +
                     "        <Data>2024-01-15</Data><Numero>FT/1/2024</Numero>\n" +
                     "      </DatiGeneraliDocumento>\n" +
                     "    </DatiGenerali>\n" +
                     "    <DatiBeniServizi>\n" +
                     "      <DatiRiepilogo><AliquotaIVA>22.00</AliquotaIVA><ImponibileImporto>100.00</ImponibileImporto><Imposta>22.00</Imposta></DatiRiepilogo>\n" +
                     "    </DatiBeniServizi>\n" +
                     "    <Allegati>\n" +
                     "      <NomeAttachment>allegato.pdf</NomeAttachment>\n" +
                     "      <Attachment>SGVsbG8=</Attachment>\n" +
                     "    </Allegati>\n" +
                     "  </FatturaElettronicaBody>\n" +
                     "</p:FatturaElettronica>";

        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "test.xml");

        assertEquals(1, invoice.getAttachments().size());
        var att = invoice.getAttachments().get(0);
        assertEquals("allegato.pdf", att.getFileName());
        assertEquals("application/pdf", att.getContentType());
        assertEquals(5, att.getData().length); // "Hello" is 5 bytes
    }

    @Test
    void parseShouldHandlePersonNameWhenDenominazioneIsMissing() throws Exception {
        when(supplierRepository.findByVatNumber(any())).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                     "<p:FatturaElettronica xmlns:p=\"http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2\">\n" +
                     "  <FatturaElettronicaHeader>\n" +
                     "    <CedentePrestatore>\n" +
                     "      <DatiAnagrafici>\n" +
                     "        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>RSSMRA80A01H501U</IdCodice></IdFiscaleIVA>\n" +
                     "        <Anagrafica><Nome>Mario</Nome><Cognome>Rossi</Cognome></Anagrafica>\n" +
                     "      </DatiAnagrafici>\n" +
                     "      <Sede><Indirizzo>Via Roma 1</Indirizzo><CAP>00100</CAP><Comune>Roma</Comune></Sede>\n" +
                     "    </CedentePrestatore>\n" +
                     "  </FatturaElettronicaHeader>\n" +
                     "  <FatturaElettronicaBody>\n" +
                     "    <DatiGenerali>\n" +
                     "      <DatiGeneraliDocumento>\n" +
                     "        <TipoDocumento>TD01</TipoDocumento><Divisa>EUR</Divisa>\n" +
                     "        <Data>2024-01-15</Data><Numero>FT/1/2024</Numero>\n" +
                     "      </DatiGeneraliDocumento>\n" +
                     "    </DatiGenerali>\n" +
                     "    <DatiBeniServizi>\n" +
                     "      <DatiRiepilogo><AliquotaIVA>22.00</AliquotaIVA><ImponibileImporto>100.00</ImponibileImporto><Imposta>22.00</Imposta></DatiRiepilogo>\n" +
                     "    </DatiBeniServizi>\n" +
                     "  </FatturaElettronicaBody>\n" +
                     "</p:FatturaElettronica>";

        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "test.xml");

        assertNotNull(invoice.getSupplier());
        assertTrue(invoice.getSupplier().getName().contains("Rossi"));
        assertTrue(invoice.getSupplier().getName().contains("Mario"));
    }

    @Test
    void parseShouldHandleMissingCedentePrestatore() throws Exception {
        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                     "<p:FatturaElettronica xmlns:p=\"http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2\">\n" +
                     "  <FatturaElettronicaHeader/>\n" +
                     "  <FatturaElettronicaBody>\n" +
                     "    <DatiGenerali>\n" +
                     "      <DatiGeneraliDocumento>\n" +
                     "        <TipoDocumento>TD01</TipoDocumento><Divisa>EUR</Divisa>\n" +
                     "        <Data>2024-01-15</Data><Numero>FT/1/2024</Numero>\n" +
                     "      </DatiGeneraliDocumento>\n" +
                     "    </DatiGenerali>\n" +
                     "    <DatiBeniServizi>\n" +
                     "      <DatiRiepilogo><AliquotaIVA>22.00</AliquotaIVA><ImponibileImporto>100.00</ImponibileImporto><Imposta>22.00</Imposta></DatiRiepilogo>\n" +
                     "    </DatiBeniServizi>\n" +
                     "  </FatturaElettronicaBody>\n" +
                     "</p:FatturaElettronica>";

        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "no-supplier.xml");

        assertNull(invoice.getSupplier());
        assertEquals("TD01", invoice.getDocumentType());
    }

    @Test
    void parseShouldHandleMultipleLineItems() throws Exception {
        when(supplierRepository.findByVatNumber(any())).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                     "<p:FatturaElettronica xmlns:p=\"http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2\">\n" +
                     "  <FatturaElettronicaHeader>\n" +
                     "    <CedentePrestatore>\n" +
                     "      <DatiAnagrafici>\n" +
                     "        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>01234567890</IdCodice></IdFiscaleIVA>\n" +
                     "        <Anagrafica><Denominazione>Alfa SRL</Denominazione></Anagrafica>\n" +
                     "      </DatiAnagrafici>\n" +
                     "      <Sede><Indirizzo>Via Roma 1</Indirizzo><CAP>00100</CAP><Comune>Roma</Comune></Sede>\n" +
                     "    </CedentePrestatore>\n" +
                     "  </FatturaElettronicaHeader>\n" +
                     "  <FatturaElettronicaBody>\n" +
                     "    <DatiGenerali>\n" +
                     "      <DatiGeneraliDocumento>\n" +
                     "        <TipoDocumento>TD01</TipoDocumento><Divisa>EUR</Divisa>\n" +
                     "        <Data>2024-01-15</Data><Numero>FT/1</Numero>\n" +
                     "      </DatiGeneraliDocumento>\n" +
                     "    </DatiGenerali>\n" +
                     "    <DatiBeniServizi>\n" +
                     "      <DettaglioLinee><NumeroLinea>1</NumeroLinea><Descrizione>Prodotto A</Descrizione>" +
                     "        <PrezzoUnitario>100.00</PrezzoUnitario><PrezzoTotale>100.00</PrezzoTotale>" +
                     "        <AliquotaIVA>22.00</AliquotaIVA></DettaglioLinee>\n" +
                     "      <DettaglioLinee><NumeroLinea>2</NumeroLinea><Descrizione>Prodotto B</Descrizione>" +
                     "        <PrezzoUnitario>200.00</PrezzoUnitario><PrezzoTotale>200.00</PrezzoTotale>" +
                     "        <AliquotaIVA>10.00</AliquotaIVA></DettaglioLinee>\n" +
                     "      <DatiRiepilogo><AliquotaIVA>22.00</AliquotaIVA><ImponibileImporto>100.00</ImponibileImporto><Imposta>22.00</Imposta></DatiRiepilogo>\n" +
                     "      <DatiRiepilogo><AliquotaIVA>10.00</AliquotaIVA><ImponibileImporto>200.00</ImponibileImporto><Imposta>20.00</Imposta></DatiRiepilogo>\n" +
                     "    </DatiBeniServizi>\n" +
                     "  </FatturaElettronicaBody>\n" +
                     "</p:FatturaElettronica>";

        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "multi.xml");

        assertEquals(2, invoice.getLineItems().size());
        assertEquals("Prodotto A", invoice.getLineItems().get(0).getDescription());
        assertEquals("Prodotto B", invoice.getLineItems().get(1).getDescription());
        // Tax totals should be sum of DatiRiepilogo: 100 + 200 = 300
        assertEquals(0, new BigDecimal("300.00").compareTo(invoice.getTaxableAmount()));
        // Tax: 22 + 20 = 42
        assertEquals(0, new BigDecimal("42.00").compareTo(invoice.getTaxAmount()));
    }

    @Test
    void parseShouldHandleLineItemWithArticleCodes() throws Exception {
        when(supplierRepository.findByVatNumber(any())).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                     "<p:FatturaElettronica xmlns:p=\"http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2\">\n" +
                     "  <FatturaElettronicaHeader>\n" +
                     "    <CedentePrestatore>\n" +
                     "      <DatiAnagrafici>\n" +
                     "        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>01234567890</IdCodice></IdFiscaleIVA>\n" +
                     "        <Anagrafica><Denominazione>Alfa SRL</Denominazione></Anagrafica>\n" +
                     "      </DatiAnagrafici>\n" +
                     "      <Sede><Indirizzo>Via Roma 1</Indirizzo><CAP>00100</CAP><Comune>Roma</Comune></Sede>\n" +
                     "    </CedentePrestatore>\n" +
                     "  </FatturaElettronicaHeader>\n" +
                     "  <FatturaElettronicaBody>\n" +
                     "    <DatiGenerali>\n" +
                     "      <DatiGeneraliDocumento>\n" +
                     "        <TipoDocumento>TD01</TipoDocumento><Divisa>EUR</Divisa>\n" +
                     "        <Data>2024-01-15</Data><Numero>FT/1</Numero>\n" +
                     "      </DatiGeneraliDocumento>\n" +
                     "    </DatiGenerali>\n" +
                     "    <DatiBeniServizi>\n" +
                     "      <DettaglioLinee>\n" +
                     "        <NumeroLinea>1</NumeroLinea><Descrizione>Caffè</Descrizione>\n" +
                     "        <CodiceArticolo><CodiceTipo>EN</CodiceTipo><CodiceValore>8012345678901</CodiceValore></CodiceArticolo>\n" +
                     "        <CodiceArticolo><CodiceTipo>COD</CodiceTipo><CodiceValore>ART001</CodiceValore></CodiceArticolo>\n" +
                     "        <PrezzoUnitario>5.00</PrezzoUnitario><PrezzoTotale>5.00</PrezzoTotale><AliquotaIVA>10.00</AliquotaIVA>\n" +
                     "      </DettaglioLinee>\n" +
                     "      <DatiRiepilogo><AliquotaIVA>10.00</AliquotaIVA><ImponibileImporto>5.00</ImponibileImporto><Imposta>0.50</Imposta></DatiRiepilogo>\n" +
                     "    </DatiBeniServizi>\n" +
                     "  </FatturaElettronicaBody>\n" +
                     "</p:FatturaElettronica>";

        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "codes.xml");

        assertEquals(1, invoice.getLineItems().size());
        var item = invoice.getLineItems().get(0);
        assertEquals("8012345678901", item.getEanCode());
        assertEquals("COD", item.getArticleCodeType());
        assertEquals("ART001", item.getArticleCode());
    }

    @Test
    void parseShouldHandleLineItemWithDiscount() throws Exception {
        when(supplierRepository.findByVatNumber(any())).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                     "<p:FatturaElettronica xmlns:p=\"http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2\">\n" +
                     "  <FatturaElettronicaHeader>\n" +
                     "    <CedentePrestatore>\n" +
                     "      <DatiAnagrafici>\n" +
                     "        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>01234567890</IdCodice></IdFiscaleIVA>\n" +
                     "        <Anagrafica><Denominazione>Alfa SRL</Denominazione></Anagrafica>\n" +
                     "      </DatiAnagrafici>\n" +
                     "      <Sede><Indirizzo>Via Roma 1</Indirizzo><CAP>00100</CAP><Comune>Roma</Comune></Sede>\n" +
                     "    </CedentePrestatore>\n" +
                     "  </FatturaElettronicaHeader>\n" +
                     "  <FatturaElettronicaBody>\n" +
                     "    <DatiGenerali>\n" +
                     "      <DatiGeneraliDocumento>\n" +
                     "        <TipoDocumento>TD01</TipoDocumento><Divisa>EUR</Divisa>\n" +
                     "        <Data>2024-01-15</Data><Numero>FT/1</Numero>\n" +
                     "      </DatiGeneraliDocumento>\n" +
                     "    </DatiGenerali>\n" +
                     "    <DatiBeniServizi>\n" +
                     "      <DettaglioLinee>\n" +
                     "        <NumeroLinea>1</NumeroLinea><Descrizione>Prodotto scontato</Descrizione>\n" +
                     "        <PrezzoUnitario>100.00</PrezzoUnitario><PrezzoTotale>90.00</PrezzoTotale><AliquotaIVA>22.00</AliquotaIVA>\n" +
                     "        <ScontoMaggiorazione><Tipo>SC</Tipo><Percentuale>10.00</Percentuale></ScontoMaggiorazione>\n" +
                     "      </DettaglioLinee>\n" +
                     "      <DatiRiepilogo><AliquotaIVA>22.00</AliquotaIVA><ImponibileImporto>90.00</ImponibileImporto><Imposta>19.80</Imposta></DatiRiepilogo>\n" +
                     "    </DatiBeniServizi>\n" +
                     "  </FatturaElettronicaBody>\n" +
                     "</p:FatturaElettronica>";

        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "discount.xml");

        assertEquals(1, invoice.getLineItems().size());
        var item = invoice.getLineItems().get(0);
        assertEquals("SC", item.getDiscountType());
        assertEquals(0, new BigDecimal("10.00").compareTo(item.getDiscountPercentage()));
    }

    @Test
    void parseShouldHandleNonPdfAttachmentContentType() throws Exception {
        when(supplierRepository.findByVatNumber(any())).thenReturn(Optional.empty());
        when(supplierRepository.save(any(Supplier.class))).thenAnswer(inv -> inv.getArgument(0));

        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
                     "<p:FatturaElettronica xmlns:p=\"http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2\">\n" +
                     "  <FatturaElettronicaHeader>\n" +
                     "    <CedentePrestatore>\n" +
                     "      <DatiAnagrafici>\n" +
                     "        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>01234567890</IdCodice></IdFiscaleIVA>\n" +
                     "        <Anagrafica><Denominazione>Alfa SRL</Denominazione></Anagrafica>\n" +
                     "      </DatiAnagrafici>\n" +
                     "      <Sede><Indirizzo>Via Roma 1</Indirizzo><CAP>00100</CAP><Comune>Roma</Comune></Sede>\n" +
                     "    </CedentePrestatore>\n" +
                     "  </FatturaElettronicaHeader>\n" +
                     "  <FatturaElettronicaBody>\n" +
                     "    <DatiGenerali>\n" +
                     "      <DatiGeneraliDocumento>\n" +
                     "        <TipoDocumento>TD01</TipoDocumento><Divisa>EUR</Divisa>\n" +
                     "        <Data>2024-01-15</Data><Numero>FT/1</Numero>\n" +
                     "      </DatiGeneraliDocumento>\n" +
                     "    </DatiGenerali>\n" +
                     "    <DatiBeniServizi>\n" +
                     "      <DatiRiepilogo><AliquotaIVA>22.00</AliquotaIVA><ImponibileImporto>100.00</ImponibileImporto><Imposta>22.00</Imposta></DatiRiepilogo>\n" +
                     "    </DatiBeniServizi>\n" +
                     "    <Allegati>\n" +
                     "      <NomeAttachment>documento.xml</NomeAttachment>\n" +
                     "      <Attachment>dGVzdA==</Attachment>\n" +
                     "    </Allegati>\n" +
                     "    <Allegati>\n" +
                     "      <NomeAttachment>dati.bin</NomeAttachment>\n" +
                     "      <Attachment>dGVzdA==</Attachment>\n" +
                     "    </Allegati>\n" +
                     "  </FatturaElettronicaBody>\n" +
                     "</p:FatturaElettronica>";

        Invoice invoice = parser.parse(new ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)), "test.xml");

        assertEquals(2, invoice.getAttachments().size());
        assertEquals("application/xml", invoice.getAttachments().get(0).getContentType());
        assertEquals("application/octet-stream", invoice.getAttachments().get(1).getContentType());
    }
}
