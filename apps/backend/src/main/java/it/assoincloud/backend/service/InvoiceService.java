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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import it.assoincloud.backend.dto.ImportResultDto;
import it.assoincloud.backend.dto.InvoiceFormData;
import it.assoincloud.backend.entity.Invoice;
import it.assoincloud.backend.entity.InvoiceAttachment;
import it.assoincloud.backend.entity.InvoiceSourceFile;
import it.assoincloud.backend.entity.Supplier;
import it.assoincloud.backend.repository.InvoiceAttachmentRepository;
import it.assoincloud.backend.repository.InvoiceRepository;
import it.assoincloud.backend.repository.InvoiceSourceFileRepository;
import it.assoincloud.backend.repository.SupplierRepository;

@Service
@Transactional
public class InvoiceService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceService.class);
    private static final DateTimeFormatter CSV_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final InvoiceRepository invoiceRepository;
    private final SupplierRepository supplierRepository;
    private final InvoiceAttachmentRepository attachmentRepository;
    private final InvoiceSourceFileRepository sourceFileRepository;
    private final FatturaElettronicaParser xmlParser;

    public InvoiceService(InvoiceRepository invoiceRepository,
                           SupplierRepository supplierRepository,
                           InvoiceAttachmentRepository attachmentRepository,
                           InvoiceSourceFileRepository sourceFileRepository,
                           FatturaElettronicaParser xmlParser) {
        this.invoiceRepository = invoiceRepository;
        this.supplierRepository = supplierRepository;
        this.attachmentRepository = attachmentRepository;
        this.sourceFileRepository = sourceFileRepository;
        this.xmlParser = xmlParser;
    }

    // ---- CRUD ----

    @Transactional(readOnly = true)
    public List<Invoice> findAll() {
        log.info("Fetching all invoices");
        return invoiceRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Invoice findById(String id) {
        log.debug("Fetching invoice by id: {}", id);
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invoice not found: " + id));
    }

    public Invoice create(InvoiceFormData data) {
        log.info("Creating invoice: number={}, supplier={}", data.invoiceNumber(), data.supplierName());
        Invoice inv = new Invoice();
        applyFormData(inv, data);
        Invoice saved = invoiceRepository.save(inv);
        log.info("Invoice created with id: {}", saved.getId());
        return saved;
    }

    public Invoice update(String id, InvoiceFormData data) {
        log.info("Updating invoice id: {}", id);
        Invoice inv = findById(id);
        applyFormData(inv, data);
        return invoiceRepository.save(inv);
    }

    public void delete(String id) {
        log.info("Deleting invoice id: {}", id);
        invoiceRepository.deleteById(id);
    }

    // ---- CSV Upload ----

    public ImportResultDto importCsv(MultipartFile file) {
        log.info("Importing invoices from CSV file: {}", file.getOriginalFilename());
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
            log.error("Error during CSV import for file '{}': {}", file.getOriginalFilename(), e.getMessage(), e);
            throw new RuntimeException("Errore durante l'elaborazione del CSV: " + e.getMessage(), e);
        }
        log.info("CSV import completed: imported={}, skipped={}", importedCount, skippedCount);
        return new ImportResultDto(importedCount, 0, skippedCount);
    }

    // ---- XML Upload ----

    public ImportResultDto importXml(MultipartFile file) {
        log.info("Importing invoice from XML/P7M file: {}", file.getOriginalFilename());
        try {
            String originalFileName = file.getOriginalFilename();
            byte[] bytes = file.getBytes();
            return importXmlFromBytes(bytes, originalFileName, file.getContentType());
        } catch (Exception e) {
            log.error("Error during XML import for file '{}': {}", file.getOriginalFilename(), e.getMessage(), e);
            throw new RuntimeException("Errore durante l'elaborazione del file: " + e.getMessage(), e);
        }
    }

    public ImportResultDto importXmlFromBytes(byte[] bytes, String filename) {
        return importXmlFromBytes(bytes, filename, detectContentType(filename));
    }

    public ImportResultDto importXmlFromBytes(byte[] bytes, String filename, String contentType) {
        log.info("Parsing invoice file: {}", filename);
        try {
            String sourceFileName = normalizeFileName(filename);
            String sourceContentType = normalizeContentType(contentType, sourceFileName);
            java.io.InputStream xmlInput;
            if (P7mContentExtractor.isP7mFile(filename)) {
                byte[] xmlBytes = P7mContentExtractor.extractContent(bytes);
                xmlInput = new ByteArrayInputStream(xmlBytes);
            } else {
                xmlInput = new ByteArrayInputStream(bytes);
            }

            Invoice invoice = xmlParser.parse(xmlInput, filename);

            if (invoice.getSupplier() != null && invoice.getInvoiceNumber() != null) {
                var existing = invoiceRepository.findBySupplier_VatNumberAndInvoiceNumber(
                        invoice.getSupplier().getVatNumber(), invoice.getInvoiceNumber());
                if (existing.isPresent()) {
                    log.info("Invoice already exists, updating: number={}, file={}", invoice.getInvoiceNumber(), filename);
                    Invoice old = existing.get();
                    old.getLineItems().clear();
                    old.getAttachments().clear();
                    copyInvoiceData(invoice, old);
                    attachSourceFile(old, bytes, sourceFileName, sourceContentType);
                    invoiceRepository.save(old);
                    return new ImportResultDto(0, 1, 0);
                }
            }

            attachSourceFile(invoice, bytes, sourceFileName, sourceContentType);
            invoiceRepository.save(invoice);
            log.info("Invoice imported: number={}, file={}", invoice.getInvoiceNumber(), filename);
            return new ImportResultDto(1, 0, 0);
        } catch (Exception e) {
            log.error("Error parsing invoice file '{}': {}", filename, e.getMessage(), e);
            throw new RuntimeException("Errore durante l'elaborazione del file: " + e.getMessage(), e);
        }
    }

    // ---- Attachment retrieval ----

    @Transactional(readOnly = true)
    public InvoiceAttachment getAttachment(String invoiceId, String attachmentId) {
        return attachmentRepository.findByIdAndInvoiceId(attachmentId, invoiceId)
                .orElseThrow(() -> new IllegalArgumentException("Allegato non trovato"));
    }

    @Transactional(readOnly = true)
    public InvoiceSourceFile getSourceFile(String invoiceId) {
        log.info("Fetching source file for invoice id: {}", invoiceId);
        if (!invoiceRepository.existsById(invoiceId)) {
            throw new IllegalArgumentException("Fattura non trovata");
        }
        return sourceFileRepository.findByInvoiceId(invoiceId)
                .orElseThrow(() -> new IllegalStateException("File originale della fattura non disponibile"));
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

    private void attachSourceFile(Invoice invoice, byte[] bytes, String fileName, String contentType) {
        InvoiceSourceFile sourceFile = invoice.getSourceFile();
        if (sourceFile == null) {
            sourceFile = new InvoiceSourceFile();
            invoice.setSourceFile(sourceFile);
        }
        sourceFile.setFileName(fileName);
        sourceFile.setContentType(contentType);
        sourceFile.setData(bytes);
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
                        log.info("Updating supplier name for VAT {}: '{}' -> '{}'", vatNumber, existing.getName(), name);
                        existing.setName(name);
                        return supplierRepository.save(existing);
                    }
                    return existing;
                })
                .orElseGet(() -> {
                    log.info("Creating new supplier: name='{}', VAT={}", name, vatNumber);
                    return supplierRepository.save(new Supplier(name, vatNumber));
                });
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

    private static String normalizeFileName(String filename) {
        return filename != null && !filename.isBlank() ? filename : "fattura";
    }

    private static String normalizeContentType(String contentType, String filename) {
        if (contentType != null && !contentType.isBlank()) {
            return contentType;
        }
        return detectContentType(filename);
    }

    private static String detectContentType(String filename) {
        if (filename != null && P7mContentExtractor.isP7mFile(filename)) {
            return "application/pkcs7-mime";
        }
        if (filename != null && filename.toLowerCase().endsWith(".xml")) {
            return "application/xml";
        }
        return "application/octet-stream";
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
