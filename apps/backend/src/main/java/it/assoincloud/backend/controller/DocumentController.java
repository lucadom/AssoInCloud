package it.assoincloud.backend.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import it.assoincloud.backend.dto.BulkMoveRequest;
import it.assoincloud.backend.dto.BulkPathsRequest;
import it.assoincloud.backend.dto.CreateFolderRequest;
import it.assoincloud.backend.dto.DocumentFileDto;
import it.assoincloud.backend.dto.FolderContentsDto;
import it.assoincloud.backend.dto.FolderDto;
import it.assoincloud.backend.dto.MoveFileRequest;
import it.assoincloud.backend.dto.MoveFolderRequest;
import it.assoincloud.backend.dto.RenameFileRequest;
import it.assoincloud.backend.dto.RenameFolderRequest;
import it.assoincloud.backend.service.DocumentService;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin
public class DocumentController {

    private static final Logger log = LoggerFactory.getLogger(DocumentController.class);

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping("/browse")
    public ResponseEntity<FolderContentsDto> browse(@RequestParam(defaultValue = "") String path) throws IOException {
        return ResponseEntity.ok(documentService.listContents(path));
    }

    @PostMapping("/folders")
    public ResponseEntity<FolderDto> createFolder(@RequestBody CreateFolderRequest req) throws IOException {
        FolderDto folder = documentService.createFolder(req.path(), req.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(folder);
    }

    @PutMapping("/folders")
    public ResponseEntity<FolderDto> renameFolder(@RequestBody RenameFolderRequest req) throws IOException {
        return ResponseEntity.ok(documentService.renameFolder(req.path(), req.name()));
    }

    @PutMapping("/folders/move")
    public ResponseEntity<FolderDto> moveFolder(@RequestBody MoveFolderRequest req) throws IOException {
        return ResponseEntity.ok(documentService.moveFolder(req.path(), req.targetPath()));
    }

    @DeleteMapping("/folders")
    public ResponseEntity<Void> deleteFolder(@RequestParam String path) throws IOException {
        documentService.deleteFolder(path);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/folders/download")
    public ResponseEntity<StreamingResponseBody> downloadFolder(@RequestParam(defaultValue = "") String path) {
        String folderName = path.isEmpty() ? "documenti" : path.substring(path.lastIndexOf('/') + 1);
        StreamingResponseBody body = out -> documentService.streamFolderZip(path, out);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + folderName + ".zip\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(body);
    }

    @PostMapping("/files")
    public ResponseEntity<List<DocumentFileDto>> uploadFiles(
            @RequestParam(defaultValue = "") String path,
            @RequestParam("files") List<MultipartFile> files) throws IOException {
        List<DocumentFileDto> result = documentService.uploadFiles(path, files);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @GetMapping("/files/download")
    public ResponseEntity<StreamingResponseBody> downloadFile(@RequestParam String path) throws IOException {
        Path file = documentService.resolveFilePath(path);
        String filename = file.getFileName().toString();
        String mimeType = Files.probeContentType(file);
        if (mimeType == null) mimeType = "application/octet-stream";
        StreamingResponseBody body = out -> Files.copy(file, out);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(mimeType))
                .body(body);
    }

    @PutMapping("/files")
    public ResponseEntity<DocumentFileDto> renameFile(@RequestBody RenameFileRequest req) throws IOException {
        return ResponseEntity.ok(documentService.renameFile(req.path(), req.name()));
    }

    @PutMapping("/files/move")
    public ResponseEntity<DocumentFileDto> moveFile(@RequestBody MoveFileRequest req) throws IOException {
        return ResponseEntity.ok(documentService.moveFile(req.path(), req.targetPath()));
    }

    @DeleteMapping("/files")
    public ResponseEntity<Void> deleteFile(@RequestParam String path) throws IOException {
        documentService.deleteFile(path);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/files/bulk-delete")
    public ResponseEntity<Void> bulkDeleteFiles(@RequestBody BulkPathsRequest req) throws IOException {
        documentService.bulkDeleteFiles(req.paths());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/files/bulk-move")
    public ResponseEntity<Map<String, Object>> bulkMoveFiles(@RequestBody BulkMoveRequest req) throws IOException {
        DocumentService.BulkMoveResult result = documentService.bulkMoveFiles(req.paths(), req.targetPath());
        return ResponseEntity.ok(Map.of("moved", result.moved(), "failed", result.failed()));
    }

    @PostMapping("/files/bulk-download")
    public ResponseEntity<StreamingResponseBody> bulkDownloadFiles(@RequestBody BulkPathsRequest req) {
        StreamingResponseBody body = out -> documentService.streamBulkDownloadZip(req.paths(), out);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"download.zip\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(body);
    }
}
