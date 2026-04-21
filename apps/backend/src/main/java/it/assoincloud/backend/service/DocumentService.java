package it.assoincloud.backend.service;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.DirectoryStream;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import jakarta.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import it.assoincloud.backend.dto.DocumentFileDto;
import it.assoincloud.backend.dto.FolderContentsDto;
import it.assoincloud.backend.dto.FolderDto;
import it.assoincloud.backend.exception.DocumentConflictException;
import it.assoincloud.backend.exception.DocumentNotFoundException;

@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    private final Path storageRoot;

    public DocumentService(@Value("${assoincloud.documents.root:./data/documents}") String rootPath) {
        this.storageRoot = Paths.get(rootPath).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(storageRoot);
            log.info("Document storage root: {}", storageRoot);
        } catch (IOException e) {
            log.error("Failed to create document storage root", e);
            throw new RuntimeException("Impossibile creare la cartella dei documenti", e);
        }
    }

    private Path resolveSafe(String relative) {
        Path resolved = storageRoot.resolve(relative == null ? "" : relative).normalize();
        if (!resolved.startsWith(storageRoot)) {
            throw new IllegalArgumentException("Percorso non valido");
        }
        return resolved;
    }

    // ---- Folder operations ----

    public FolderContentsDto listContents(String relative) throws IOException {
        Path dir = resolveSafe(relative);
        if (!Files.isDirectory(dir)) {
            throw new DocumentNotFoundException("Cartella non trovata: " + relative);
        }
        List<FolderDto> folders = new ArrayList<>();
        List<DocumentFileDto> files = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir)) {
            for (Path entry : stream) {
                BasicFileAttributes attrs = Files.readAttributes(entry, BasicFileAttributes.class);
                if (attrs.isDirectory()) {
                    folders.add(FolderDto.from(storageRoot, entry, attrs));
                } else {
                    files.add(DocumentFileDto.from(storageRoot, entry, attrs));
                }
            }
        }
        folders.sort(Comparator.comparing(FolderDto::name, String.CASE_INSENSITIVE_ORDER));
        files.sort(Comparator.comparing(DocumentFileDto::name, String.CASE_INSENSITIVE_ORDER));
        return new FolderContentsDto(folders, files);
    }

    public FolderDto createFolder(String parentRelative, String name) throws IOException {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Il nome della cartella non può essere vuoto");
        }
        Path parent = resolveSafe(parentRelative);
        if (!Files.isDirectory(parent)) {
            throw new DocumentNotFoundException("Cartella padre non trovata");
        }
        Path newDir = parent.resolve(name);
        if (Files.exists(newDir)) {
            throw new DocumentConflictException("Esiste già una cartella con questo nome");
        }
        Files.createDirectory(newDir);
        BasicFileAttributes attrs = Files.readAttributes(newDir, BasicFileAttributes.class);
        log.info("Created folder: {}", storageRoot.relativize(newDir));
        return FolderDto.from(storageRoot, newDir, attrs);
    }

    public FolderDto renameFolder(String relative, String newName) throws IOException {
        if (newName == null || newName.isBlank()) {
            throw new IllegalArgumentException("Il nome della cartella non può essere vuoto");
        }
        Path folder = resolveSafe(relative);
        if (!Files.isDirectory(folder)) {
            throw new DocumentNotFoundException("Cartella non trovata: " + relative);
        }
        Path renamed = folder.getParent().resolve(newName);
        if (Files.exists(renamed)) {
            throw new DocumentConflictException("Esiste già una cartella con questo nome");
        }
        Files.move(folder, renamed, StandardCopyOption.ATOMIC_MOVE);
        BasicFileAttributes attrs = Files.readAttributes(renamed, BasicFileAttributes.class);
        log.info("Renamed folder {} -> {}", relative, storageRoot.relativize(renamed));
        return FolderDto.from(storageRoot, renamed, attrs);
    }

    public FolderDto moveFolder(String relative, String targetRelative) throws IOException {
        Path folder = resolveSafe(relative);
        if (!Files.isDirectory(folder)) {
            throw new DocumentNotFoundException("Cartella non trovata: " + relative);
        }
        Path targetParent = resolveSafe(targetRelative);
        if (!Files.isDirectory(targetParent)) {
            throw new DocumentNotFoundException("Cartella di destinazione non trovata");
        }
        // Circular move guard
        if (targetParent.startsWith(folder)) {
            throw new IllegalArgumentException("Impossibile spostare una cartella in una sua sottocartella");
        }
        Path dest = targetParent.resolve(folder.getFileName());
        if (Files.exists(dest)) {
            throw new DocumentConflictException("Esiste già una cartella con questo nome nella destinazione");
        }
        Files.move(folder, dest, StandardCopyOption.ATOMIC_MOVE);
        BasicFileAttributes attrs = Files.readAttributes(dest, BasicFileAttributes.class);
        log.info("Moved folder {} -> {}", relative, storageRoot.relativize(dest));
        return FolderDto.from(storageRoot, dest, attrs);
    }

    public void deleteFolder(String relative) throws IOException {
        Path folder = resolveSafe(relative);
        if (!Files.isDirectory(folder)) {
            throw new DocumentNotFoundException("Cartella non trovata: " + relative);
        }
        Files.walkFileTree(folder, new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                Files.delete(file);
                return FileVisitResult.CONTINUE;
            }
            @Override
            public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                Files.delete(dir);
                return FileVisitResult.CONTINUE;
            }
        });
        log.info("Deleted folder recursively: {}", relative);
    }

    public void streamFolderZip(String relative, OutputStream out) throws IOException {
        Path folder = resolveSafe(relative);
        if (!Files.isDirectory(folder)) {
            throw new DocumentNotFoundException("Cartella non trovata: " + relative);
        }
        try (ZipOutputStream zip = new ZipOutputStream(out)) {
            Files.walkFileTree(folder, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    String entryName = folder.relativize(file).toString().replace("\\", "/");
                    zip.putNextEntry(new ZipEntry(entryName));
                    Files.copy(file, zip);
                    zip.closeEntry();
                    return FileVisitResult.CONTINUE;
                }
            });
        }
        log.info("Streamed folder as ZIP: {}", relative);
    }

    // ---- File operations ----

    public List<DocumentFileDto> uploadFiles(String relative, List<MultipartFile> files) throws IOException {
        Path dir = resolveSafe(relative);
        if (!Files.isDirectory(dir)) {
            throw new DocumentNotFoundException("Cartella non trovata: " + relative);
        }
        List<DocumentFileDto> result = new ArrayList<>();
        for (MultipartFile file : files) {
            String name = file.getOriginalFilename();
            if (name == null || name.isBlank()) {
                name = "file";
            }
            // Strip path separators from original filename
            name = Path.of(name).getFileName().toString();
            Path dest = dir.resolve(name);
            if (Files.exists(dest)) {
                throw new DocumentConflictException("Esiste già un file con questo nome: " + name);
            }
            file.transferTo(dest);
            BasicFileAttributes attrs = Files.readAttributes(dest, BasicFileAttributes.class);
            result.add(DocumentFileDto.from(storageRoot, dest, attrs));
            log.info("Uploaded file: {}", storageRoot.relativize(dest));
        }
        return result;
    }

    public Path resolveFilePath(String relative) {
        Path file = resolveSafe(relative);
        if (!Files.isRegularFile(file)) {
            throw new DocumentNotFoundException("File non trovato: " + relative);
        }
        return file;
    }

    public DocumentFileDto renameFile(String relative, String newName) throws IOException {
        if (newName == null || newName.isBlank()) {
            throw new IllegalArgumentException("Il nome del file non può essere vuoto");
        }
        Path file = resolveSafe(relative);
        if (!Files.isRegularFile(file)) {
            throw new DocumentNotFoundException("File non trovato: " + relative);
        }
        Path renamed = file.getParent().resolve(newName);
        if (Files.exists(renamed)) {
            throw new DocumentConflictException("Esiste già un file con questo nome");
        }
        Files.move(file, renamed, StandardCopyOption.ATOMIC_MOVE);
        BasicFileAttributes attrs = Files.readAttributes(renamed, BasicFileAttributes.class);
        log.info("Renamed file {} -> {}", relative, storageRoot.relativize(renamed));
        return DocumentFileDto.from(storageRoot, renamed, attrs);
    }

    public DocumentFileDto moveFile(String relative, String targetRelative) throws IOException {
        Path file = resolveSafe(relative);
        if (!Files.isRegularFile(file)) {
            throw new DocumentNotFoundException("File non trovato: " + relative);
        }
        Path targetDir = resolveSafe(targetRelative);
        if (!Files.isDirectory(targetDir)) {
            throw new DocumentNotFoundException("Cartella di destinazione non trovata");
        }
        Path dest = targetDir.resolve(file.getFileName());
        if (Files.exists(dest)) {
            throw new DocumentConflictException("Esiste già un file con questo nome nella destinazione");
        }
        Files.move(file, dest, StandardCopyOption.ATOMIC_MOVE);
        BasicFileAttributes attrs = Files.readAttributes(dest, BasicFileAttributes.class);
        log.info("Moved file {} -> {}", relative, storageRoot.relativize(dest));
        return DocumentFileDto.from(storageRoot, dest, attrs);
    }

    public void deleteFile(String relative) throws IOException {
        Path file = resolveSafe(relative);
        if (!Files.isRegularFile(file)) {
            throw new DocumentNotFoundException("File non trovato: " + relative);
        }
        Files.delete(file);
        log.info("Deleted file: {}", relative);
    }

    // ---- Bulk operations ----

    public void bulkDeleteFiles(List<String> paths) throws IOException {
        for (String rel : paths) {
            Path file = resolveSafe(rel);
            if (Files.isRegularFile(file)) {
                Files.delete(file);
                log.info("Bulk deleted file: {}", rel);
            } else {
                log.warn("Bulk delete: file not found, skipping: {}", rel);
            }
        }
    }

    public record BulkMoveResult(int moved, List<String> failed) {}

    public BulkMoveResult bulkMoveFiles(List<String> paths, String targetRelative) throws IOException {
        Path targetDir = resolveSafe(targetRelative);
        if (!Files.isDirectory(targetDir)) {
            throw new DocumentNotFoundException("Cartella di destinazione non trovata");
        }
        int moved = 0;
        List<String> failed = new ArrayList<>();
        for (String rel : paths) {
            Path file = resolveSafe(rel);
            if (!Files.isRegularFile(file)) {
                failed.add(rel + ": file non trovato");
                continue;
            }
            Path dest = targetDir.resolve(file.getFileName());
            if (Files.exists(dest)) {
                failed.add(rel + ": nome già esistente nella destinazione");
                continue;
            }
            try {
                Files.move(file, dest, StandardCopyOption.ATOMIC_MOVE);
                moved++;
                log.info("Bulk moved file: {} -> {}", rel, storageRoot.relativize(dest));
            } catch (IOException e) {
                failed.add(rel + ": " + e.getMessage());
                log.error("Bulk move failed for {}", rel, e);
            }
        }
        return new BulkMoveResult(moved, failed);
    }

    public void streamBulkDownloadZip(List<String> paths, OutputStream out) throws IOException {
        try (ZipOutputStream zip = new ZipOutputStream(out)) {
            for (String rel : paths) {
                Path file = resolveSafe(rel);
                if (!Files.isRegularFile(file)) {
                    log.warn("Bulk download: file not found, skipping: {}", rel);
                    continue;
                }
                zip.putNextEntry(new ZipEntry(file.getFileName().toString()));
                Files.copy(file, zip);
                zip.closeEntry();
            }
        }
        log.info("Streamed bulk download ZIP ({} paths)", paths.size());
    }
}
