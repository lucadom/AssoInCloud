package it.assoincloud.backend.service;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import it.assoincloud.backend.entity.Invoice;
import it.assoincloud.backend.entity.InvoiceAttachment;
import it.assoincloud.backend.entity.InvoiceLineItem;
import it.assoincloud.backend.entity.Supplier;
import it.assoincloud.backend.repository.SupplierRepository;

/**
 * Parses FatturaPA XML (FPR12 / FPA12) and extracts all relevant data.
 */
@Service
public class FatturaElettronicaParser {

    private final SupplierRepository supplierRepository;

    public FatturaElettronicaParser(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    /**
     * Parse an XML InputStream into an Invoice entity with line items and attachments.
     */
    public Invoice parse(InputStream xmlInput, String originalFileName) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        // Security: disable external entities
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(xmlInput);
        doc.getDocumentElement().normalize();

        Invoice invoice = new Invoice();
        invoice.setFileName(originalFileName);

        // --- Header: CedentePrestatore (Supplier) ---
        parseSupplier(doc, invoice);

        // --- Body: DatiGenerali ---
        parseDatiGenerali(doc, invoice);

        // --- Body: DatiBeniServizi (Line Items) ---
        parseLineItems(doc, invoice);

        // --- Body: DatiRiepilogo (Summary / Tax totals) ---
        parseDatiRiepilogo(doc, invoice);

        // --- Body: DatiPagamento ---
        parseDatiPagamento(doc, invoice);

        // --- Body: Allegati (Attachments) ---
        parseAllegati(doc, invoice);

        return invoice;
    }

    private void parseSupplier(Document doc, Invoice invoice) {
        Element cedente = getFirstElement(doc, "CedentePrestatore");
        if (cedente == null) return;

        Element datiAnag = getFirstElement(cedente, "DatiAnagrafici");
        if (datiAnag == null) return;

        // VAT number
        String rawVat = "";
        Element idFiscaleIva = getFirstElement(datiAnag, "IdFiscaleIVA");
        if (idFiscaleIva != null) {
            rawVat = getTextContent(idFiscaleIva, "IdCodice");
        }
        final String vatNumber = rawVat;

        // Fiscal code
        String fiscalCode = getTextContent(datiAnag, "CodiceFiscale");

        // Name
        String supplierName = "";
        Element anagrafica = getFirstElement(datiAnag, "Anagrafica");
        if (anagrafica != null) {
            supplierName = getTextContent(anagrafica, "Denominazione");
            if (supplierName.isEmpty()) {
                String cognome = getTextContent(anagrafica, "Cognome");
                String nome = getTextContent(anagrafica, "Nome");
                supplierName = (cognome + " " + nome).trim();
            }
        }
        final String finalName = supplierName;

        // Resolve or create supplier
        if (!vatNumber.isEmpty()) {
            Supplier supplier = supplierRepository.findByVatNumber(vatNumber)
                    .orElseGet(() -> {
                        Supplier s = new Supplier(finalName, vatNumber);
                        return supplierRepository.save(s);
                    });
            // Update name if changed
            if (!finalName.isEmpty() && !supplier.getName().equals(finalName)) {
                supplier.setName(finalName);
                supplier = supplierRepository.save(supplier);
            }
            invoice.setSupplier(supplier);
        }

        invoice.setSupplierFiscalCode(fiscalCode);

        // Sede (Address)
        Element sede = getFirstElement(cedente, "Sede");
        if (sede != null) {
            invoice.setSupplierAddress(getTextContent(sede, "Indirizzo"));
            invoice.setSupplierCap(getTextContent(sede, "CAP"));
            invoice.setSupplierCity(getTextContent(sede, "Comune"));
            invoice.setSupplierProvince(getTextContent(sede, "Provincia"));
        }
    }

    private void parseDatiGenerali(Document doc, Invoice invoice) {
        Element datiGeneraliDoc = getFirstElement(doc, "DatiGeneraliDocumento");
        if (datiGeneraliDoc == null) return;

        invoice.setDocumentType(getTextContent(datiGeneraliDoc, "TipoDocumento"));
        invoice.setCurrency(getTextContent(datiGeneraliDoc, "Divisa"));

        String dateStr = getTextContent(datiGeneraliDoc, "Data");
        if (!dateStr.isEmpty()) {
            invoice.setDate(LocalDate.parse(dateStr));
        }

        invoice.setInvoiceNumber(getTextContent(datiGeneraliDoc, "Numero"));

        String totaleDoc = getTextContent(datiGeneraliDoc, "ImportoTotaleDocumento");
        if (!totaleDoc.isEmpty()) {
            invoice.setTotalAmount(new BigDecimal(totaleDoc));
        }

        invoice.setCausale(getTextContent(datiGeneraliDoc, "Causale"));
    }

    private void parseLineItems(Document doc, Invoice invoice) {
        NodeList dettaglioList = doc.getElementsByTagName("DettaglioLinee");
        List<InvoiceLineItem> items = new ArrayList<>();

        for (int i = 0; i < dettaglioList.getLength(); i++) {
            Element el = (Element) dettaglioList.item(i);
            InvoiceLineItem item = new InvoiceLineItem();
            item.setInvoice(invoice);

            String numLinea = getTextContent(el, "NumeroLinea");
            if (!numLinea.isEmpty()) {
                item.setLineNumber(Integer.parseInt(numLinea));
            } else {
                item.setLineNumber(i + 1);
            }

            item.setDescription(getTextContent(el, "Descrizione"));

            String qty = getTextContent(el, "Quantita");
            if (!qty.isEmpty()) {
                item.setQuantity(new BigDecimal(qty));
            }

            item.setUnitOfMeasure(getTextContent(el, "UnitaMisura"));

            String unitPrice = getTextContent(el, "PrezzoUnitario");
            if (!unitPrice.isEmpty()) {
                item.setUnitPrice(new BigDecimal(unitPrice));
            }

            String totalPrice = getTextContent(el, "PrezzoTotale");
            if (!totalPrice.isEmpty()) {
                item.setTotalPrice(new BigDecimal(totalPrice));
            }

            String vatRate = getTextContent(el, "AliquotaIVA");
            if (!vatRate.isEmpty()) {
                item.setVatRate(new BigDecimal(vatRate));
            }

            // Article codes
            NodeList codiceArticoloList = el.getElementsByTagName("CodiceArticolo");
            for (int j = 0; j < codiceArticoloList.getLength(); j++) {
                Element codice = (Element) codiceArticoloList.item(j);
                String tipo = getTextContent(codice, "CodiceTipo");
                String valore = getTextContent(codice, "CodiceValore");
                if ("EN".equals(tipo)) {
                    item.setEanCode(valore);
                } else if (item.getArticleCode() == null) {
                    item.setArticleCodeType(tipo);
                    item.setArticleCode(valore);
                }
            }

            // Discount
            Element sconto = getFirstElement(el, "ScontoMaggiorazione");
            if (sconto != null) {
                item.setDiscountType(getTextContent(sconto, "Tipo"));
                String perc = getTextContent(sconto, "Percentuale");
                if (!perc.isEmpty()) {
                    item.setDiscountPercentage(new BigDecimal(perc));
                }
            }

            items.add(item);
        }

        invoice.getLineItems().addAll(items);
    }

    private void parseDatiRiepilogo(Document doc, Invoice invoice) {
        NodeList riepilogoList = doc.getElementsByTagName("DatiRiepilogo");
        BigDecimal totalImponibile = BigDecimal.ZERO;
        BigDecimal totalImposta = BigDecimal.ZERO;

        for (int i = 0; i < riepilogoList.getLength(); i++) {
            Element el = (Element) riepilogoList.item(i);
            String imponibile = getTextContent(el, "ImponibileImporto");
            String imposta = getTextContent(el, "Imposta");
            if (!imponibile.isEmpty()) {
                totalImponibile = totalImponibile.add(new BigDecimal(imponibile));
            }
            if (!imposta.isEmpty()) {
                totalImposta = totalImposta.add(new BigDecimal(imposta));
            }
        }

        invoice.setTaxableAmount(totalImponibile);
        invoice.setTaxAmount(totalImposta);
    }

    private void parseDatiPagamento(Document doc, Invoice invoice) {
        Element dettaglioPagamento = getFirstElement(doc, "DettaglioPagamento");
        if (dettaglioPagamento == null) return;

        invoice.setPaymentMethod(getTextContent(dettaglioPagamento, "ModalitaPagamento"));
        invoice.setPaymentDueDate(getTextContent(dettaglioPagamento, "DataScadenzaPagamento"));

        String importoPagamento = getTextContent(dettaglioPagamento, "ImportoPagamento");
        if (!importoPagamento.isEmpty()) {
            invoice.setPaymentAmount(new BigDecimal(importoPagamento));
        }

        invoice.setIban(getTextContent(dettaglioPagamento, "IBAN"));
    }

    private void parseAllegati(Document doc, Invoice invoice) {
        NodeList allegatiList = doc.getElementsByTagName("Allegati");
        List<InvoiceAttachment> attachments = new ArrayList<>();

        for (int i = 0; i < allegatiList.getLength(); i++) {
            Element el = (Element) allegatiList.item(i);
            String nomeAttachment = getTextContent(el, "NomeAttachment");
            String attachmentData = getTextContent(el, "Attachment");

            if (!attachmentData.isEmpty()) {
                InvoiceAttachment att = new InvoiceAttachment();
                att.setInvoice(invoice);
                att.setFileName(nomeAttachment);

                // Determine content type from file extension
                if (nomeAttachment.toLowerCase().endsWith(".pdf")) {
                    att.setContentType("application/pdf");
                } else if (nomeAttachment.toLowerCase().endsWith(".xml")) {
                    att.setContentType("application/xml");
                } else {
                    att.setContentType("application/octet-stream");
                }

                // Decode base64
                att.setData(Base64.getDecoder().decode(attachmentData.replaceAll("\\s+", "")));
                attachments.add(att);
            }
        }

        invoice.getAttachments().addAll(attachments);
    }

    // --- XML helper methods ---

    private static Element getFirstElement(Document doc, String tagName) {
        NodeList list = doc.getElementsByTagName(tagName);
        return list.getLength() > 0 ? (Element) list.item(0) : null;
    }

    private static Element getFirstElement(Element parent, String tagName) {
        NodeList list = parent.getElementsByTagName(tagName);
        return list.getLength() > 0 ? (Element) list.item(0) : null;
    }

    private static String getTextContent(Element parent, String tagName) {
        NodeList list = parent.getElementsByTagName(tagName);
        if (list.getLength() > 0) {
            String text = list.item(0).getTextContent();
            return text != null ? text.trim() : "";
        }
        return "";
    }
}
