package it.assoincloud.backend.service;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import it.assoincloud.backend.dto.ImportResultDto;
import it.assoincloud.backend.dto.InvoiceFormData;
import it.assoincloud.backend.entity.Invoice;
import it.assoincloud.backend.entity.InvoiceAttachment;
import it.assoincloud.backend.entity.Supplier;
import it.assoincloud.backend.repository.InvoiceAttachmentRepository;
import it.assoincloud.backend.repository.InvoiceRepository;
import it.assoincloud.backend.repository.SupplierRepository;

@Service
@Transactional
public class InvoiceService {

    private static final DateTimeFormatter CSV_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final InvoiceRepository invoiceRepository;
    private final SupplierRepository supplierRepository;
    private final InvoiceAttachmentRepository attachmentRepository;
    private final FatturaElettronicaParser xmlParser;

    public InvoiceService(InvoiceRepository invoiceRepository,
                          SupplierRepository supplierRepository,
                          InvoiceAttachmentRepository attachmentRepository,
                          FatturaElettronicaParser xmlParser) {
        this.invoiceRepository = invoiceRepository;
        this.supplierRepository = supplierRepository;
        this.attachmentRepository = attachmentRepository;
        this.xmlParser = xmlParser;
    }

    // ---- CRUD ----

    @Transactional(readOnly = true)
    public List<Invoice> findAll() {
        return invoiceRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Invoice findById(String id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + id));
    }

    public Invoice create(InvoiceFormData data) {
        Invoice inv = new Invoice();
        applyFormData(inv, data);
        return invoiceRepository.save(inv);
    }

    public Invoice update(String id, InvoiceFormData data) {
        Invoice inv = findById(id);
        applyFormData(inv, data);
        return invoiceRepository.save(inv);
    }

    public void delete(String id) {
        invoiceRepository.deleteById(id);
    }

    // ---- CSV Upload ----

    public ImportResultDto importCsv(MultipartFile file) {
        int importedCount = 0;
        int skippedCount = 0;
        try (var reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean header = true;
            while ((line = reader.readLine()) != null) {
                if (header) {
                    header = false;
                    continue; // skip header row
                }
                if (line.isBlank()) continue;

                String[] cols = parseCsvLine(line);
                if (cols.length < 9) continue;

                String documentType = unquote(cols[0]);
                String invoiceNumber = unquote(cols[1]);
                String dateStr = unquote(cols[2]);
                String vatNumber = unquote(cols[3]);
                String supplierName = unquote(cols[4]);
                String taxableStr = unquote(cols[5]);
                String taxStr = unquote(cols[6]);
                String sdiNumber = unquote(cols[7]);
                String viewedStr = unquote(cols[8]);

                // Skip duplicates: if invoice already exists, do not overwrite
                if (invoiceRepository.findBySupplier_VatNumberAndInvoiceNumber(vatNumber, invoiceNumber).isPresent()) {
                    skippedCount++;
                    continue;
                }

                Supplier supplier = resolveSupplier(vatNumber, supplierName);

                Invoice inv = new Invoice();
                inv.setDocumentType(documentType);
                inv.setInvoiceNumber(invoiceNumber);
                inv.setDate(LocalDate.parse(dateStr, CSV_DATE_FMT));
                inv.setSupplier(supplier);
                inv.setTaxableAmount(parseDecimal(taxableStr));
                inv.setTaxAmount(parseDecimal(taxStr));
                inv.setSdiNumber(sdiNumber);
                inv.setViewed("Fattura visualizzata".equalsIgnoreCase(viewedStr));

                invoiceRepository.save(inv);
                importedCount++;
            }
        } catch (Exception e) {
            throw new RuntimeException("Errore durante l'elaborazione del CSV: " + e.getMessage(), e);
        }
        return new ImportResultDto(importedCount, 0, skippedCount);
    }

    // ---- XML Upload ----

    public ImportResultDto importXml(MultipartFile file) {
        try {
            String originalFileName = file.getOriginalFilename();
            java.io.InputStream xmlInput;

            if (P7mContentExtractor.isP7mFile(originalFileName)) {
                byte[] xmlBytes = P7mContentExtractor.extractContent(file.getBytes());
                xmlInput = new ByteArrayInputStream(xmlBytes);
            } else {
                xmlInput = file.getInputStream();
            }

            Invoice invoice = xmlParser.parse(xmlInput, originalFileName);

            // Upsert: if invoice already exists, overwrite it
            if (invoice.getSupplier() != null && invoice.getInvoiceNumber() != null) {
                var existing = invoiceRepository.findBySupplier_VatNumberAndInvoiceNumber(
                        invoice.getSupplier().getVatNumber(), invoice.getInvoiceNumber());
                if (existing.isPresent()) {
                    Invoice old = existing.get();
                    // Remove old line items and attachments, then copy new data onto existing entity
                    old.getLineItems().clear();
                    old.getAttachments().clear();
                    copyInvoiceData(invoice, old);
                    invoiceRepository.save(old);
                    return new ImportResultDto(0, 1, 0);
                }
            }

            invoiceRepository.save(invoice);
            return new ImportResultDto(1, 0, 0);
        } catch (Exception e) {
            throw new RuntimeException("Errore durante l'elaborazione del file: " + e.getMessage(), e);
        }
    }

    // ---- Attachment retrieval ----

    @Transactional(readOnly = true)
    public InvoiceAttachment getAttachment(String invoiceId, String attachmentId) {
        return attachmentRepository.findByIdAndInvoiceId(attachmentId, invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Allegato non trovato"));
    }

    // ---- Helpers ----

    /**
     * Copy all data fields from a newly parsed invoice onto an existing entity,
     * preserving the existing entity's ID. Line items and attachments are re-parented.
     */
    private void copyInvoiceData(Invoice source, Invoice target) {
        target.setDocumentType(source.getDocumentType());
        target.setInvoiceNumber(source.getInvoiceNumber());
        target.setDate(source.getDate());
        target.setSupplier(source.getSupplier());
        target.setTaxableAmount(source.getTaxableAmount());
        target.setTaxAmount(source.getTaxAmount());
        target.setTotalAmount(source.getTotalAmount());
        target.setSdiNumber(source.getSdiNumber());
        target.setViewed(source.isViewed());
        target.setFileName(source.getFileName());
        target.setCurrency(source.getCurrency());
        target.setCausale(source.getCausale());
        target.setPaymentMethod(source.getPaymentMethod());
        target.setPaymentDueDate(source.getPaymentDueDate());
        target.setPaymentAmount(source.getPaymentAmount());
        target.setIban(source.getIban());
        target.setSupplierFiscalCode(source.getSupplierFiscalCode());
        target.setSupplierAddress(source.getSupplierAddress());
        target.setSupplierCap(source.getSupplierCap());
        target.setSupplierCity(source.getSupplierCity());
        target.setSupplierProvince(source.getSupplierProvince());

        // Re-parent line items
        for (var item : source.getLineItems()) {
            item.setInvoice(target);
            target.getLineItems().add(item);
        }
        // Re-parent attachments
        for (var att : source.getAttachments()) {
            att.setInvoice(target);
            target.getAttachments().add(att);
        }
    }

    private void applyFormData(Invoice inv, InvoiceFormData data) {
        inv.setDocumentType(data.documentType() != null ? data.documentType() : "");
        inv.setInvoiceNumber(data.invoiceNumber());
        inv.setDate(parseDate(data.date()));
        inv.setTaxableAmount(data.taxableAmount());
        inv.setTaxAmount(data.taxAmount());
        inv.setSdiNumber(data.sdiNumber() != null ? data.sdiNumber() : "");
        inv.setViewed(data.viewed());

        Supplier supplier = resolveSupplier(data.supplierVatNumber(), data.supplierName());
        inv.setSupplier(supplier);
    }

    private Supplier resolveSupplier(String vatNumber, String name) {
        return supplierRepository.findByVatNumber(vatNumber)
                .map(existing -> {
                    if (!existing.getName().equals(name)) {
                        existing.setName(name);
                        return supplierRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> supplierRepository.save(new Supplier(name, vatNumber)));
    }

    private static LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("La data è obbligatoria");
        }
        // Accept ISO datetime (from frontend Date.toISOString()) or ISO date
        if (raw.contains("T")) {
            return LocalDate.parse(raw.substring(0, raw.indexOf('T')));
        }
        return LocalDate.parse(raw);
    }

    /**
     * Parse a decimal string that uses comma as decimal separator (e.g. "1.234,56" or "471,80").
     */
    private static BigDecimal parseDecimal(String raw) {
        if (raw == null || raw.isBlank()) return BigDecimal.ZERO;
        // Remove thousand-separator dots and replace comma with dot
        String normalized = raw.replace(".", "").replace(",", ".");
        return new BigDecimal(normalized);
    }

    private static String unquote(String s) {
        if (s == null) return "";
        String trimmed = s.trim();
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
            return trimmed.substring(1, trimmed.length() - 1);
        }
        return trimmed;
    }

    /**
     * Split a semicolon-delimited CSV line, respecting quoted fields.
     */
    private static String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                inQuotes = !inQuotes;
                current.append(c);
            } else if (c == ';' && !inQuotes) {
                fields.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        fields.add(current.toString());
        return fields.toArray(new String[0]);
    }
}
