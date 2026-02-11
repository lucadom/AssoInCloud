package it.assoincloud.backend;

import java.io.File;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		ensureDbDirectoryExists();
		SpringApplication.run(BackendApplication.class, args);
	}

	/**
	 * Create the parent directory for the SQLite database file before Spring
	 * tries to open a connection. The path is read from the same env variable
	 * used in application.yaml (ASSOINCLOUD_DB_PATH), falling back to the
	 * default ./data/assoincloud.db.
	 */
	private static void ensureDbDirectoryExists() {
		String dbPath = System.getenv("ASSOINCLOUD_DB_PATH");
		if (dbPath == null || dbPath.isBlank()) {
			dbPath = "./data/assoincloud.db";
		}
		File parent = new File(dbPath).getParentFile();
		if (parent != null && !parent.exists()) {
			parent.mkdirs();
		}
	}

}
