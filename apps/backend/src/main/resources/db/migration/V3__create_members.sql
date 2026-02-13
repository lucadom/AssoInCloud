-- Members table for association members
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    birth_date TEXT,
    birth_place TEXT,
    fiscal_code TEXT NOT NULL UNIQUE,
    address TEXT,
    city TEXT,
    phone TEXT,
    membership_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_members_fiscal_code ON members(fiscal_code);
CREATE INDEX IF NOT EXISTS idx_members_last_name ON members(last_name);
