-- Invoice line items (DettaglioLinee from FatturaPA XML)
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id              TEXT    PRIMARY KEY,
    invoice_id      TEXT    NOT NULL,
    line_number     INTEGER NOT NULL,
    description     TEXT    NOT NULL,
    quantity        REAL,
    unit_of_measure TEXT,
    unit_price      REAL,
    total_price     REAL,
    vat_rate        REAL,
    article_code    TEXT,
    article_code_type TEXT,
    ean_code        TEXT,
    discount_type   TEXT,
    discount_percentage REAL,
    CONSTRAINT fk_line_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Invoice PDF attachments (Allegati from FatturaPA XML)
CREATE TABLE IF NOT EXISTS invoice_attachments (
    id              TEXT    PRIMARY KEY,
    invoice_id      TEXT    NOT NULL,
    file_name       TEXT    NOT NULL,
    content_type    TEXT    NOT NULL DEFAULT 'application/pdf',
    data            BLOB    NOT NULL,
    CONSTRAINT fk_attachment_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Add new columns to invoices for XML-specific data
ALTER TABLE invoices ADD COLUMN currency TEXT DEFAULT 'EUR';
ALTER TABLE invoices ADD COLUMN causale TEXT;
ALTER TABLE invoices ADD COLUMN payment_method TEXT;
ALTER TABLE invoices ADD COLUMN payment_due_date TEXT;
ALTER TABLE invoices ADD COLUMN payment_amount REAL;
ALTER TABLE invoices ADD COLUMN iban TEXT;
ALTER TABLE invoices ADD COLUMN supplier_fiscal_code TEXT;
ALTER TABLE invoices ADD COLUMN supplier_address TEXT;
ALTER TABLE invoices ADD COLUMN supplier_cap TEXT;
ALTER TABLE invoices ADD COLUMN supplier_city TEXT;
ALTER TABLE invoices ADD COLUMN supplier_province TEXT;
