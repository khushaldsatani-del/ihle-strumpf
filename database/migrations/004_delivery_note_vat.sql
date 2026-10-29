-- Ihle's change requests for the checkout:
-- • "Anmerkung zur Lieferung": a free text the customer writes for the delivery (replaces typing in a new address)
-- • the VAT rate of each order line at order time (from NAV's VAT code, e.g. VAT19 → 19), so the totals shown for an
--   order (net, VAT, gross) stay as they were ordered, even if NAV changes an article's rate later.
--   NULL for orders placed before this column existed; those are shown with 19 %, the rate of every NAV article so far.
-- Only adds columns with defaults, so code that doesn't know them keeps working unchanged.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_note text NOT NULL DEFAULT '';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS vat_rate numeric(5, 2);
