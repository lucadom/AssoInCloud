package it.assoincloud.backend.controller;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import it.assoincloud.backend.dto.ImportResultDto;
import it.assoincloud.backend.dto.InvoiceDto;
import it.assoincloud.backend.dto.PecFolderDto;
import it.assoincloud.backend.dto.PecMessageDto;
import it.assoincloud.backend.dto.PecMessageSummaryDto;
import it.assoincloud.backend.service.FatturaElettronicaParser;
import it.assoincloud.backend.service.P7mContentExtractor;
import it.assoincloud.backend.service.PecService;

@RestController
@RequestMapping("/api/pec")
@CrossOrigin
public class PecController {

    private final PecService pecService;
    private final FatturaElettronicaParser xmlParser;
    private final it.assoincloud.backend.service.InvoiceService invoiceService;

    public PecController(PecService pecService, FatturaElettronicaParser xmlParser,
            it.assoincloud.backend.service.InvoiceService invoiceService) {
        this.pecService = pecService;
        this.xmlParser = xmlParser;
        this.invoiceService = invoiceService;
    }

    private ResponseEntity<Map<String, String>> notConfigured() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Accesso alla casella PEC non configurato"));
    }

    @GetMapping("/folders")
    public ResponseEntity<?> listFolders() {
        if (!pecService.isConfigured()) {
            return notConfigured();
        }
        List<PecFolderDto> folders = pecService.listFolders();
        return ResponseEntity.ok(folders);
    }

    @GetMapping("/messages")
    public ResponseEntity<?> listMessages(
            @RequestParam String folder,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        if (!pecService.isConfigured()) {
            return notConfigured();
        }
        List<PecMessageSummaryDto> messages = pecService.listMessages(folder, page, size);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/messages/search")
    public ResponseEntity<?> searchMessages(
            @RequestParam String folder,
            @RequestParam String query) {
        if (!pecService.isConfigured()) {
            return notConfigured();
        }
        List<PecMessageSummaryDto> messages = pecService.searchMessages(folder, query);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/messages/{uid}")
    public ResponseEntity<?> getMessage(
            @PathVariable long uid,
            @RequestParam String folder,
            @RequestParam(defaultValue = "false") boolean envelope) {
        if (!pecService.isConfigured()) {
            return notConfigured();
        }
        PecMessageDto message = pecService.getMessage(folder, uid, envelope);
        return ResponseEntity.ok(message);
    }

    @PatchMapping("/messages/{uid}")
    public ResponseEntity<?> setReadStatus(
            @PathVariable long uid,
            @RequestParam String folder,
            @RequestBody ReadStatusRequest body) {
        if (!pecService.isConfigured()) {
            return notConfigured();
        }
        pecService.setReadStatus(folder, uid, body.read());
        return ResponseEntity.noContent().build();
    }

    record ReadStatusRequest(boolean read) {}

    @GetMapping("/attachments/{uid}/{partIndex}/preview-as-invoice")
    public ResponseEntity<?> previewAttachmentAsInvoice(
            @PathVariable long uid,
            @PathVariable int partIndex,
            @RequestParam String folder,
            @RequestParam(defaultValue = "false") boolean envelope) {
        if (!pecService.isConfigured()) {
            return notConfigured();
        }
        try {
            PecService.AttachmentData data = pecService.getAttachmentBytes(folder, uid, partIndex, envelope);
            byte[] xmlBytes = P7mContentExtractor.isP7mFile(data.filename())
                    ? P7mContentExtractor.extractContent(data.bytes())
                    : data.bytes();
            var invoice = xmlParser.parse(new ByteArrayInputStream(xmlBytes), data.filename());
            return ResponseEntity.ok(InvoiceDto.from(invoice));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Impossibile analizzare il file come fattura: " + e.getMessage()));
        }
    }

    @PostMapping("/attachments/{uid}/{partIndex}/import-as-invoice")
    public ResponseEntity<?> importAttachmentAsInvoice(
            @PathVariable long uid,
            @PathVariable int partIndex,
            @RequestParam String folder,
            @RequestParam(defaultValue = "false") boolean envelope) {
        if (!pecService.isConfigured()) {
            return notConfigured();
        }
        try {
            PecService.AttachmentData data = pecService.getAttachmentBytes(folder, uid, partIndex, envelope);
            ImportResultDto result = invoiceService.importXmlFromBytes(data.bytes(), data.filename(), data.contentType());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Impossibile importare la fattura: " + e.getMessage()));
        }
    }

    @GetMapping("/attachments/{uid}/{partIndex}")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable long uid,
            @PathVariable int partIndex,
            @RequestParam String folder,
            @RequestParam(defaultValue = "false") boolean envelope,
            @RequestParam(defaultValue = "false") boolean inline) {
        if (!pecService.isConfigured()) {
            return ResponseEntity.notFound().build();
        }
        PecService.AttachmentData data = pecService.getAttachmentBytes(folder, uid, partIndex, envelope);
        ByteArrayResource resource = new ByteArrayResource(data.bytes());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(inline
                ? ContentDisposition.inline().filename(data.filename()).build()
                : ContentDisposition.attachment().filename(data.filename()).build());
        headers.setContentType(MediaType.parseMediaType(data.contentType()));
        headers.setContentLength(data.bytes().length);
        return ResponseEntity.ok().headers(headers).body(resource);
    }
}
