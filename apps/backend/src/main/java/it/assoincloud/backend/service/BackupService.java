package it.assoincloud.backend.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Objects;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationVersion;
import org.springframework.stereotype.Service;
import org.sqlite.SQLiteConnection;
import org.sqlite.core.DB;

import jakarta.persistence.EntityManagerFactory;

@Service
public class BackupService {

    private static final byte[] SQLITE_HEADER = "SQLite format 3\000".getBytes();

    private final DataSource dataSource;
    private final Flyway flyway;
    private final EntityManagerFactory entityManagerFactory;

    public BackupService(DataSource dataSource, Flyway flyway, EntityManagerFactory entityManagerFactory) {
        this.dataSource = dataSource;
        this.flyway = flyway;
        this.entityManagerFactory = entityManagerFactory;
    }

    /**
     * Returns the current database version based on applied Flyway migrations.
     */
    public String getCurrentVersion() {
        MigrationInfo[] applied = flyway.info().applied();
        return Arrays.stream(applied)
                .map(MigrationInfo::getVersion)
                .filter(Objects::nonNull)
                .max(Comparator.naturalOrder())
                .map(MigrationVersion::toString)
                .orElse("unknown");
    }

    /**
     * Creates a binary backup of the current SQLite database and returns it as a byte array.
     * Uses sqlite3_serialize() which produces a standard SQLite database file format.
     */
    public byte[] downloadBackup() throws SQLException {
        try (Connection conn = dataSource.getConnection()) {
            SQLiteConnection sqliteConn = conn.unwrap(SQLiteConnection.class);
            return sqliteConn.getDatabase().serialize("main");
        }
    }

    /**
     * Reads the Flyway schema version from a SQLite database file provided as a byte array.
     * Returns "unknown" if the flyway_schema_history table is absent or unreadable.
     */
    public String readVersionFromBytes(byte[] dbBytes) throws IOException {
        validateSqliteHeader(dbBytes);

        Path tempFile = Files.createTempFile("assoincloud_inspect_", ".db");
        try {
            Files.write(tempFile, dbBytes);
            return readVersionFromFile(tempFile.toAbsolutePath().toString());
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    /**
     * Restores the SQLite database from the provided byte array.
     * Validates the SQLite header before proceeding.
     * Evicts the JPA L2 cache after restore to prevent stale reads.
     */
    public void restoreBackup(byte[] dbBytes) throws SQLException, IOException {
        validateSqliteHeader(dbBytes);

        Path tempFile = Files.createTempFile("assoincloud_restore_", ".db");
        try {
            Files.write(tempFile, dbBytes);
            try (Connection conn = dataSource.getConnection()) {
                SQLiteConnection sqliteConn = conn.unwrap(SQLiteConnection.class);
                DB db = sqliteConn.getDatabase();
                db.restore("main", tempFile.toAbsolutePath().toString(), null);
            }
            entityManagerFactory.getCache().evictAll();
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    private void validateSqliteHeader(byte[] data) {
        if (data == null || data.length < SQLITE_HEADER.length) {
            throw new IllegalArgumentException("Il file non è un database SQLite valido");
        }
        for (int i = 0; i < SQLITE_HEADER.length; i++) {
            if (data[i] != SQLITE_HEADER[i]) {
                throw new IllegalArgumentException("Il file non è un database SQLite valido");
            }
        }
    }

    private String readVersionFromFile(String filePath) {
        String url = "jdbc:sqlite:" + filePath;
        try (Connection conn = DriverManager.getConnection(url);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(
                     "SELECT MAX(version) FROM flyway_schema_history WHERE success = 1")) {
            if (rs.next()) {
                String version = rs.getString(1);
                return version != null ? version : "unknown";
            }
            return "unknown";
        } catch (SQLException e) {
            // Table may not exist (e.g. non-Flyway database)
            return "unknown";
        }
    }
}
