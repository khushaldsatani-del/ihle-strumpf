-- NAV's code lists (nav_ShopItemCategories.xml, nav_ShopProductGroup.xml): the German description of each item category
-- and product group code that products carry. The shop names its categories and groups from here (description, or
-- the code when NAV has none). Imports add and update entries, never delete them.
-- Only adds a table, so code that doesn't know it keeps working unchanged.
CREATE TABLE IF NOT EXISTS nav_codes (
  kind         text NOT NULL CHECK (kind IN ('category', 'group')),
  code         text NOT NULL,                     -- e.g. "DIABETES P" or "201 KLAS"
  description  text NOT NULL DEFAULT '',          -- e.g. "Katalog-Artikel Diabetes & Problemfuß"; may be empty
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (kind, code)
);
