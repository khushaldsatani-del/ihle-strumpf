-- Article names and short texts in other languages, from NAV's <Translations> in nav_ShopItems.xml.
-- { "en": { "name": "Diabetic Sock classic", "description": "loop cuff, no elastic, linked toe" }, "fr": { … } }
-- German stays in products.name / products.description (the shop's standard language).
-- Only adds a column with a default, so code that doesn't know it keeps working unchanged.
ALTER TABLE products ADD COLUMN IF NOT EXISTS translations jsonb NOT NULL DEFAULT '{}'::jsonb;
