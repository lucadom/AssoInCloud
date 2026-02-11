CREATE TABLE IF NOT EXISTS suppliers (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    vat_number  TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS invoices (
    id              TEXT        PRIMARY KEY,
    document_type   TEXT,
    invoice_number  TEXT        NOT NULL,
    date            TEXT        NOT NULL,
    supplier_id     TEXT        NOT NULL,
    taxable_amount  REAL        NOT NULL,
    tax_amount      REAL        NOT NULL,
    total_amount    REAL        NOT NULL,
    sdi_number      TEXT,
    viewed          INTEGER     NOT NULL DEFAULT 0,
    file_name       TEXT,
    CONSTRAINT fk_invoice_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);
