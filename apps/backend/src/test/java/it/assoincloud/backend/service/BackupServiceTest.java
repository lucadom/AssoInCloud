package it.assoincloud.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Integration tests for BackupService backed by an in-memory SQLite database.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
class BackupServiceTest {

    @Autowired
    private BackupService backupService;

    @Test
    void getCurrentVersionShouldReturnLatestMigrationVersion() {
        String version = backupService.getCurrentVersion();
        assertThat(version).isEqualTo("3");
    }

    @Test
    void downloadBackupShouldReturnValidSqliteBytes() throws Exception {
        byte[] backup = backupService.downloadBackup();

        assertThat(backup).isNotNull();
        assertThat(backup.length).isGreaterThan(16);
        // Verify SQLite magic header "SQLite format 3\0"
        assertThat(new String(backup, 0, 6)).isEqualTo("SQLite");
    }

    @Test
    void readVersionFromBytesShouldReturnVersionFromBackup() throws Exception {
        byte[] backup = backupService.downloadBackup();
        String version = backupService.readVersionFromBytes(backup);
        assertThat(version).isEqualTo("3");
    }

    @Test
    void readVersionFromBytesWithInvalidHeaderShouldThrow() {
        byte[] invalid = "not a sqlite file at all".getBytes();
        assertThatThrownBy(() -> backupService.readVersionFromBytes(invalid))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("SQLite");
    }

    @Test
    void readVersionFromBytesTooShortShouldThrow() {
        byte[] tooShort = new byte[4];
        assertThatThrownBy(() -> backupService.readVersionFromBytes(tooShort))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void restoreBackupShouldSucceedWithValidBackup() throws Exception {
        byte[] backup = backupService.downloadBackup();
        assertDoesNotThrow(() -> backupService.restoreBackup(backup));
    }

    @Test
    void restoreBackupWithInvalidHeaderShouldThrow() {
        byte[] invalid = "this is not a database".getBytes();
        assertThatThrownBy(() -> backupService.restoreBackup(invalid))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("SQLite");
    }
}
