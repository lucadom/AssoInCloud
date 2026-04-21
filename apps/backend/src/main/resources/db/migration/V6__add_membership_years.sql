-- Membership years tracking for annual calendar-year membership
CREATE TABLE IF NOT EXISTS membership_years (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE(member_id, year)
);

CREATE INDEX IF NOT EXISTS idx_membership_years_member_id ON membership_years(member_id);
CREATE INDEX IF NOT EXISTS idx_membership_years_year ON membership_years(year);

-- Backfill membership years for existing members from membership_date
INSERT INTO membership_years (id, member_id, year, created_at, updated_at)
SELECT
    LOWER(HEX(RANDOMBLOB(16))),
    m.id,
    CAST(STRFTIME('%Y', m.membership_date) AS INTEGER),
    datetime('now'),
    datetime('now')
FROM members m
WHERE m.membership_date IS NOT NULL
  AND CAST(STRFTIME('%Y', m.membership_date) AS INTEGER) >= 2000
ON CONFLICT(member_id, year) DO NOTHING;
