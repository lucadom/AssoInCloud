package it.assoincloud.backend.dto;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;

public record DocumentFileDto(String path, String name, long size, String mimeType, Instant lastModified) {
    public static DocumentFileDto from(Path root, Path file, BasicFileAttributes attrs) {
        String relative = root.relativize(file).toString().replace("\\", "/");
        String mime = null;
        try { mime = Files.probeContentType(file); } catch (Exception ignored) {}
        if (mime == null) mime = "application/octet-stream";
        return new DocumentFileDto(relative, file.getFileName().toString(), attrs.size(), mime, attrs.lastModifiedTime().toInstant());
    }
}
