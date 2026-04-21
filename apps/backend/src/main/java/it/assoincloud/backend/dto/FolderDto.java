package it.assoincloud.backend.dto;

import java.nio.file.Path;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;

public record FolderDto(String path, String name, Instant lastModified) {
    public static FolderDto from(Path root, Path folder, BasicFileAttributes attrs) {
        String relative = root.relativize(folder).toString().replace("\\", "/");
        return new FolderDto(relative, folder.getFileName().toString(), attrs.lastModifiedTime().toInstant());
    }
}
