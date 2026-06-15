-- Run this in your Supabase SQL Editor to set up the database.

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'new',
  payment_method TEXT DEFAULT 'cod',
  shipping_method TEXT DEFAULT 'standard',
  customer JSONB DEFAULT '{}',
  shipping JSONB DEFAULT '{}',
  items JSONB DEFAULT '[]',
  subtotal NUMERIC(12,2) DEFAULT 0,
  shipping_cost NUMERIC(12,2) DEFAULT 0,
  tax NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  payment_id TEXT,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Products (inventory) table
CREATE TABLE IF NOT EXISTS inventory (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 99,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_slug ON inventory(slug);

-- Decrease stock function
CREATE OR REPLACE FUNCTION decrease_stock(product_slug TEXT, qty INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE inventory
  SET stock = GREATEST(stock - qty, 0),
      updated_at = NOW()
  WHERE slug = product_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed inventory from existing products
-- INSERT INTO inventory (slug, name, stock) VALUES ('test-product', 'Test Product', 99) ON CONFLICT (slug) DO NOTHING;

-- Enable Row Level Security (optional — keeps data safe)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (for Netlify functions)
CREATE POLICY service_orders ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY service_inventory ON inventory FOR ALL USING (true) WITH CHECK (true);
