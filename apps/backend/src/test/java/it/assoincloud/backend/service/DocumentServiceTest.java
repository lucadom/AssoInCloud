package it.assoincloud.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import it.assoincloud.backend.dto.FolderContentsDto;
import it.assoincloud.backend.dto.FolderDto;
import it.assoincloud.backend.exception.DocumentConflictException;
import it.assoincloud.backend.exception.DocumentNotFoundException;

class DocumentServiceTest {

    @TempDir
    Path tempDir;

    DocumentService service;

    @BeforeEach
    void setUp() {
        service = new DocumentService(tempDir.toString());
        service.init();
    }

    // --- Folder tests ---

    @Test
    void createFolder_shouldCreateDirectory() throws IOException {
        FolderDto folder = service.createFolder("", "Verbali");
        assertThat(Files.isDirectory(tempDir.resolve("Verbali"))).isTrue();
        assertThat(folder.name()).isEqualTo("Verbali");
        assertThat(folder.path()).isEqualTo("Verbali");
    }

    @Test
    void createFolder_shouldThrowConflict_whenNameExists() throws IOException {
        service.createFolder("", "Verbali");
        assertThatThrownBy(() -> service.createFolder("", "Verbali"))
                .isInstanceOf(DocumentConflictException.class);
    }

    @Test
    void createFolder_shouldThrowIllegalArgument_whenNameBlank() {
        assertThatThrownBy(() -> service.createFolder("", ""))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void listContents_shouldReturnFoldersAndFiles() throws IOException {
        service.createFolder("", "Verbali");
        Files.writeString(tempDir.resolve("report.pdf"), "content");
        FolderContentsDto contents = service.listContents("");
        assertThat(contents.folders()).hasSize(1);
        assertThat(contents.files()).hasSize(1);
    }

    @Test
    void listContents_shouldReturnFoldersBeforeFiles() throws IOException {
        Files.writeString(tempDir.resolve("aaa.txt"), "x");
        service.createFolder("", "zzz");
        FolderContentsDto contents = service.listContents("");
        assertThat(contents.folders().get(0).name()).isEqualTo("zzz");
        assertThat(contents.files().get(0).name()).isEqualTo("aaa.txt");
    }

    @Test
    void listContents_shouldThrowNotFound_whenPathNotDirectory() {
        assertThatThrownBy(() -> service.listContents("nonexistent"))
                .isInstanceOf(DocumentNotFoundException.class);
    }

    @Test
    void renameFolder_shouldRenameDirectory() throws IOException {
        service.createFolder("", "Old");
        FolderDto renamed = service.renameFolder("Old", "New");
        assertThat(Files.isDirectory(tempDir.resolve("New"))).isTrue();
        assertThat(Files.exists(tempDir.resolve("Old"))).isFalse();
        assertThat(renamed.name()).isEqualTo("New");
    }

    @Test
    void renameFolder_shouldThrowConflict_whenNameExists() throws IOException {
        service.createFolder("", "A");
        service.createFolder("", "B");
        assertThatThrownBy(() -> service.renameFolder("A", "B"))
                .isInstanceOf(DocumentConflictException.class);
    }

    @Test
    void moveFolder_shouldMoveDirectory() throws IOException {
        service.createFolder("", "Source");
        service.createFolder("", "Target");
        service.moveFolder("Source", "Target");
        assertThat(Files.isDirectory(tempDir.resolve("Target/Source"))).isTrue();
    }

    @Test
    void moveFolder_shouldRejectCircularMove() throws IOException {
        service.createFolder("", "Parent");
        service.createFolder("Parent", "Child");
        assertThatThrownBy(() -> service.moveFolder("Parent", "Parent/Child"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deleteFolder_shouldDeleteRecursively() throws IOException {
        service.createFolder("", "Dir");
        Files.writeString(tempDir.resolve("Dir/file.txt"), "x");
        service.deleteFolder("Dir");
        assertThat(Files.exists(tempDir.resolve("Dir"))).isFalse();
    }

    @Test
    void resolveSafe_shouldRejectPathTraversal() {
        assertThatThrownBy(() -> service.listContents("../../etc"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // --- File tests ---

    @Test
    void uploadFiles_shouldStoreFile() throws IOException {
        MockMultipartFile file = new MockMultipartFile("files", "test.txt", "text/plain", "hello".getBytes());
        var result = service.uploadFiles("", List.of(file));
        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("test.txt");
        assertThat(Files.exists(tempDir.resolve("test.txt"))).isTrue();
    }

    @Test
    void uploadFiles_shouldThrowConflict_whenFileExists() throws IOException {
        Files.writeString(tempDir.resolve("test.txt"), "existing");
        MockMultipartFile file = new MockMultipartFile("files", "test.txt", "text/plain", "new".getBytes());
        assertThatThrownBy(() -> service.uploadFiles("", List.of(file)))
                .isInstanceOf(DocumentConflictException.class);
    }

    @Test
    void renameFile_shouldRenameFile() throws IOException {
        Files.writeString(tempDir.resolve("old.txt"), "x");
        var result = service.renameFile("old.txt", "new.txt");
        assertThat(result.name()).isEqualTo("new.txt");
        assertThat(Files.exists(tempDir.resolve("new.txt"))).isTrue();
    }

    @Test
    void moveFile_shouldMoveToTargetFolder() throws IOException {
        Files.writeString(tempDir.resolve("file.txt"), "x");
        service.createFolder("", "Target");
        var result = service.moveFile("file.txt", "Target");
        assertThat(result.path()).isEqualTo("Target/file.txt");
        assertThat(Files.exists(tempDir.resolve("Target/file.txt"))).isTrue();
    }

    @Test
    void deleteFile_shouldDeleteFile() throws IOException {
        Files.writeString(tempDir.resolve("del.txt"), "x");
        service.deleteFile("del.txt");
        assertThat(Files.exists(tempDir.resolve("del.txt"))).isFalse();
    }

    @Test
    void deleteFile_shouldThrowNotFound_whenMissing() {
        assertThatThrownBy(() -> service.deleteFile("missing.txt"))
                .isInstanceOf(DocumentNotFoundException.class);
    }

    // --- ZIP tests ---

    @Test
    void streamFolderZip_shouldContainFiles() throws IOException {
        service.createFolder("", "Dir");
        Files.writeString(tempDir.resolve("Dir/a.txt"), "a");
        Files.writeString(tempDir.resolve("Dir/b.txt"), "b");
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        service.streamFolderZip("Dir", baos);
        List<String> entries = zipEntryNames(baos.toByteArray());
        assertThat(entries).containsExactlyInAnyOrder("a.txt", "b.txt");
    }

    @Test
    void streamFolderZip_shouldReturnEmptyZipForEmptyFolder() throws IOException {
        service.createFolder("", "Empty");
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        service.streamFolderZip("Empty", baos);
        assertThat(zipEntryNames(baos.toByteArray())).isEmpty();
    }

    // --- Bulk tests ---

    @Test
    void bulkDeleteFiles_shouldDeleteExistingFiles() throws IOException {
        Files.writeString(tempDir.resolve("a.txt"), "a");
        Files.writeString(tempDir.resolve("b.txt"), "b");
        service.bulkDeleteFiles(List.of("a.txt", "b.txt", "missing.txt"));
        assertThat(Files.exists(tempDir.resolve("a.txt"))).isFalse();
        assertThat(Files.exists(tempDir.resolve("b.txt"))).isFalse();
    }

    @Test
    void bulkMoveFiles_shouldMoveAllFiles() throws IOException {
        Files.writeString(tempDir.resolve("a.txt"), "a");
        Files.writeString(tempDir.resolve("b.txt"), "b");
        service.createFolder("", "Dest");
        DocumentService.BulkMoveResult result = service.bulkMoveFiles(List.of("a.txt", "b.txt"), "Dest");
        assertThat(result.moved()).isEqualTo(2);
        assertThat(result.failed()).isEmpty();
        assertThat(Files.exists(tempDir.resolve("Dest/a.txt"))).isTrue();
    }

    @Test
    void bulkMoveFiles_shouldReportConflict() throws IOException {
        Files.writeString(tempDir.resolve("a.txt"), "a");
        service.createFolder("", "Dest");
        Files.writeString(tempDir.resolve("Dest/a.txt"), "existing");
        DocumentService.BulkMoveResult result = service.bulkMoveFiles(List.of("a.txt"), "Dest");
        assertThat(result.moved()).isEqualTo(0);
        assertThat(result.failed()).hasSize(1);
    }

    @Test
    void streamBulkDownloadZip_shouldContainSelectedFiles() throws IOException {
        Files.writeString(tempDir.resolve("a.txt"), "a");
        Files.writeString(tempDir.resolve("b.txt"), "b");
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        service.streamBulkDownloadZip(List.of("a.txt", "b.txt"), baos);
        assertThat(zipEntryNames(baos.toByteArray())).containsExactlyInAnyOrder("a.txt", "b.txt");
    }

    private List<String> zipEntryNames(byte[] zipBytes) throws IOException {
        List<String> names = new ArrayList<>();
        try (ZipInputStream zis = new ZipInputStream(new java.io.ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                names.add(entry.getName());
            }
        }
        return names;
    }
}
