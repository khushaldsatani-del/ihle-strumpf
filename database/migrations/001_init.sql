-- Ihle B2B shop: first schema. Products and customers mirror the NAV exports
-- (nav_ShopItems.xml, nav_ShopCustomers.xml); orders mirror the order XML that goes back to NAV.

-- One row per article ("40 000"); its sizes/colours are the variants below
CREATE TABLE products (
  article_no     text PRIMARY KEY,
  name           text NOT NULL,
  description    text NOT NULL DEFAULT '',
  category       text NOT NULL DEFAULT '',          -- NAV ItemCategorie, e.g. "DIABETES P"
  product_group  text NOT NULL DEFAULT '',          -- NAV ProductGroup, e.g. "201 KLAS" (may be empty)
  material       text NOT NULL DEFAULT '',
  unit           text NOT NULL DEFAULT '',
  pictures       text[] NOT NULL DEFAULT '{}',      -- file names as NAV lists them, e.g. 40000_001_01.jpg
  blocked        boolean NOT NULL DEFAULT false,    -- true when every SKU is blocked in NAV
  source         text NOT NULL DEFAULT 'import',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- One row per NAV SKU ("40 000 001 12" = article, colour, size)
CREATE TABLE variants (
  sku         text PRIMARY KEY,
  article_no  text NOT NULL REFERENCES products (article_no) ON DELETE CASCADE,
  color       text NOT NULL DEFAULT '',
  size        text NOT NULL DEFAULT '',
  price       numeric(10, 2) NOT NULL,              -- shown to price group VK01
  price2      numeric(10, 2) NOT NULL,              -- shown to price group VK02
  vat         text NOT NULL DEFAULT '',
  blocked     boolean NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX variants_article_idx ON variants (article_no);

CREATE TABLE customers (
  number              text PRIMARY KEY,             -- NAV customer number, also the shop login
  email               text NOT NULL DEFAULT '',
  price_group         text NOT NULL DEFAULT '',     -- VK01 / VK02
  customer_group      text NOT NULL DEFAULT '',
  payment_code        text NOT NULL DEFAULT '',     -- purchaseorder / debit (goes into the order XML)
  payment_method      text NOT NULL DEFAULT '',     -- RECHNUNG / BANKEINZUG
  shipping_agent      text NOT NULL DEFAULT '',
  salesperson         text NOT NULL DEFAULT '',
  vat_id              text NOT NULL DEFAULT '',
  billing             jsonb NOT NULL,               -- {company, firstName, lastName, street, postcode, city, country, phone}
  shipping_addresses  jsonb NOT NULL DEFAULT '[]',
  password_hash       text,                         -- shop login; NULL = no access yet
  source              text NOT NULL DEFAULT 'import',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- New shop orders get numbers from here. Start to be confirmed with Ihle: it is set above the
-- old Magento numbers (13000039xx) so the two series can never collide in NAV.
CREATE SEQUENCE order_no_seq START 1300100001;

CREATE TABLE orders (
  order_no          text PRIMARY KEY,
  created_at        timestamptz NOT NULL DEFAULT now(),
  customer_number   text NOT NULL REFERENCES customers (number),
  receipt_no        text NOT NULL DEFAULT '',       -- the customer's own reference ("Ihre Belegnummer")
  billing           jsonb NOT NULL,                 -- address snapshot at order time
  shipping_address  jsonb,                          -- NULL = deliver to the billing address
  payment_code      text NOT NULL DEFAULT '',
  shipping_cost     numeric(10, 2) NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'new',    -- new = not yet collected by NAV; exported = collected
  exported_at       timestamptz
);
CREATE INDEX orders_customer_idx ON orders (customer_number);
CREATE INDEX orders_created_idx ON orders (created_at DESC);

CREATE TABLE order_items (
  order_no    text NOT NULL REFERENCES orders (order_no) ON DELETE CASCADE,
  line_no     integer NOT NULL,
  sku         text NOT NULL,
  amount      integer NOT NULL CHECK (amount > 0),
  unit_price  numeric(10, 2) NOT NULL,              -- the customer's own price at order time
  commission  text NOT NULL DEFAULT '',             -- "Kommission" per line
  PRIMARY KEY (order_no, line_no)
);

CREATE TABLE import_runs (
  id          serial PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  file_name   text NOT NULL,
  type        text NOT NULL,                        -- items / customers
  created     integer NOT NULL DEFAULT 0,
  updated     integer NOT NULL DEFAULT 0,
  unchanged   integer NOT NULL DEFAULT 0,
  errors      integer NOT NULL DEFAULT 0,
  admin       text NOT NULL DEFAULT ''
);

CREATE TABLE admin_users (
  username       text PRIMARY KEY,
  name           text NOT NULL,
  password_hash  text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
