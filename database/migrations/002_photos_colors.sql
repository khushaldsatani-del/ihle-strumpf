-- Colour names come from the product name lines ("Farbe: marine"); NAV's attributes only carry the code
ALTER TABLE variants ADD COLUMN color_name text NOT NULL DEFAULT '';

-- Product photos, matched to articles by NAV's picture file names (<Pictures>: 40000_001_01.jpg).
-- Stored as resized WebP copies, so they work the same on Vercel and on Ihle's own server.
-- An article is shown in the shop only when at least one of its listed pictures is here.
CREATE TABLE photos (
  name         text PRIMARY KEY,                 -- file name without extension, lower case: 40000_001_01
  thumb        bytea NOT NULL,                   -- ~480 px, for lists and cards
  large        bytea NOT NULL,                   -- ~1400 px, for the product page and zoom
  width        integer NOT NULL,
  height       integer NOT NULL,
  uploaded_at  timestamptz NOT NULL DEFAULT now()
);
