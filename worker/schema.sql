-- The visit counter's one table (D1 database "notaste-counts").
-- One row per day, page and event; n is how many times it happened.
CREATE TABLE IF NOT EXISTS counts (
  day TEXT NOT NULL,     -- UTC date, 2026-10-08
  page TEXT NOT NULL,    -- "/" or "/games/<slug>/"
  event TEXT NOT NULL,   -- view, start or finish
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, page, event)
);

-- The Hot Seat's answers. One row per kind of answer; n is how many times it was given.
-- Players' own lever choices have model "" and ai "". A guess has the AI's id,
-- the guess in pick and what that AI's recorded run chose in ai.
CREATE TABLE IF NOT EXISTS hotseat (
  scene TEXT NOT NULL,     -- "001"
  round INTEGER NOT NULL,  -- 1 or 2
  model TEXT NOT NULL,     -- "" or an AI id, e.g. "opus"
  pick TEXT NOT NULL,      -- L1, L2 or LEAVE
  ai TEXT NOT NULL,        -- "" or L1, L2 or LEAVE
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (scene, round, model, pick, ai)
);
