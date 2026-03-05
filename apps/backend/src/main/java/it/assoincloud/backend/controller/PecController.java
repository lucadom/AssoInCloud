package it.assoincloud.backend.controller;

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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import it.assoincloud.backend.dto.PecFolderDto;
import it.assoincloud.backend.dto.PecMessageDto;
import it.assoincloud.backend.dto.PecMessageSummaryDto;
import it.assoincloud.backend.service.PecService;

@RestController
@RequestMapping("/api/pec")
@CrossOrigin
public class PecController {

    private final PecService pecService;

    public PecController(PecService pecService) {
        this.pecService = pecService;
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

    @GetMapping("/messages/{uid}")
    public ResponseEntity<?> getMessage(
            @PathVariable long uid,
            @RequestParam String folder) {
        if (!pecService.isConfigured()) {
            return notConfigured();
        }
        PecMessageDto message = pecService.getMessage(folder, uid);
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

    @GetMapping("/attachments/{uid}/{partIndex}")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable long uid,
            @PathVariable int partIndex,
            @RequestParam String folder) {
        if (!pecService.isConfigured()) {
            return ResponseEntity.notFound().build();
        }
        PecService.AttachmentData data = pecService.getAttachmentBytes(folder, uid, partIndex);
        ByteArrayResource resource = new ByteArrayResource(data.bytes());
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(
                ContentDisposition.attachment().filename(data.filename()).build());
        headers.setContentType(MediaType.parseMediaType(data.contentType()));
        headers.setContentLength(data.bytes().length);
        return ResponseEntity.ok().headers(headers).body(resource);
    }
}
