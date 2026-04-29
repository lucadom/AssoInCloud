CREATE TABLE IF NOT EXISTS invoice_source_files (
    id           TEXT PRIMARY KEY,
    invoice_id   TEXT NOT NULL UNIQUE,
    file_name    TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    data         BLOB NOT NULL,
    CONSTRAINT fk_source_file_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);
