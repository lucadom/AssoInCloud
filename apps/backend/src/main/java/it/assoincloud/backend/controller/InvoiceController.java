package it.assoincloud.backend.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import it.assoincloud.backend.dto.ImportResultDto;
import it.assoincloud.backend.dto.InvoiceDto;
import it.assoincloud.backend.dto.InvoiceFormData;
import it.assoincloud.backend.entity.InvoiceAttachment;
import it.assoincloud.backend.service.InvoiceService;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public List<InvoiceDto> list() {
        return invoiceService.findAll().stream().map(InvoiceDto::from).toList();
    }

    @GetMapping("/{id}")
    public InvoiceDto get(@PathVariable String id) {
        return InvoiceDto.from(invoiceService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InvoiceDto create(@RequestBody InvoiceFormData data) {
        return InvoiceDto.from(invoiceService.create(data));
    }

    @PutMapping("/{id}")
    public InvoiceDto update(@PathVariable String id, @RequestBody InvoiceFormData data) {
        return InvoiceDto.from(invoiceService.update(id, data));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        invoiceService.delete(id);
    }

    @PostMapping("/upload/csv")
    public ImportResultDto uploadCsv(@RequestParam("files") MultipartFile[] files) {
        int totalImported = 0;
        int totalUpdated = 0;
        int totalSkipped = 0;
        for (MultipartFile file : files) {
            ImportResultDto result = invoiceService.importCsv(file);
            totalImported += result.imported();
            totalUpdated += result.updated();
            totalSkipped += result.skipped();
        }
        return new ImportResultDto(totalImported, totalUpdated, totalSkipped);
    }

    @PostMapping("/upload/invoice")
    public ImportResultDto uploadInvoice(@RequestParam("files") MultipartFile[] files) {
        int totalImported = 0;
        int totalUpdated = 0;
        int totalSkipped = 0;
        for (MultipartFile file : files) {
            ImportResultDto result = invoiceService.importXml(file);
            totalImported += result.imported();
            totalUpdated += result.updated();
            totalSkipped += result.skipped();
        }
        return new ImportResultDto(totalImported, totalUpdated, totalSkipped);
    }

    @GetMapping("/{invoiceId}/attachments/{attachmentId}")
    public ResponseEntity<byte[]> downloadAttachment(
            @PathVariable String invoiceId,
            @PathVariable String attachmentId) {
        InvoiceAttachment att = invoiceService.getAttachment(invoiceId, attachmentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + att.getFileName() + "\"")
                .contentType(MediaType.parseMediaType(att.getContentType()))
                .body(att.getData());
    }
}
