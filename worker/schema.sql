-- The visit counter's one table (D1 database "notaste-counts").
-- One row per day, page and event; n is how many times it happened.
CREATE TABLE IF NOT EXISTS counts (
  day TEXT NOT NULL,     -- UTC date, 2026-10-08
  page TEXT NOT NULL,    -- "/" or "/games/<slug>/"
  event TEXT NOT NULL,   -- view, start or finish
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, page, event)
);
