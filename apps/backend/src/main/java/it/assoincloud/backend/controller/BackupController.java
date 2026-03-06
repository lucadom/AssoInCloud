package it.assoincloud.backend.controller;

import java.io.IOException;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import it.assoincloud.backend.dto.BackupVersionDto;
import it.assoincloud.backend.service.BackupService;

@RestController
@RequestMapping("/api/backup")
@CrossOrigin
public class BackupController {

    private static final Logger log = LoggerFactory.getLogger(BackupController.class);

    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    /**
     * Returns the current database version based on applied Flyway migrations.
     */
    @GetMapping("/version")
    public BackupVersionDto getVersion() {
        return new BackupVersionDto(backupService.getCurrentVersion());
    }

    /**
     * Downloads the current SQLite database as a binary file.
     */
    @GetMapping
    public ResponseEntity<byte[]> download() {
        try {
            byte[] data = backupService.downloadBackup();
            String version = backupService.getCurrentVersion();
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            String filename = "assoincloud_v" + version + "_" + timestamp + ".db";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(data.length)
                    .body(data);
        } catch (SQLException e) {
            log.error("Error downloading database backup: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Inspects a backup file and returns its Flyway schema version without performing a restore.
     */
    @PostMapping("/inspect")
    public ResponseEntity<?> inspect(@RequestParam("file") MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            String version = backupService.readVersionFromBytes(bytes);
            return ResponseEntity.ok(new BackupVersionDto(version));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid backup file inspected: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            log.error("Error reading backup file for inspection: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Errore nella lettura del file"));
        }
    }

    /**
     * Restores the database from an uploaded backup file.
     */
    @PostMapping("/restore")
    public ResponseEntity<?> restore(@RequestParam("file") MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            backupService.restoreBackup(bytes);
            return ResponseEntity.ok(Map.of("message", "Ripristino completato"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid backup file for restore: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (SQLException | IOException e) {
            log.error("Error restoring database backup: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Errore durante il ripristino del database"));
        }
    }
}
