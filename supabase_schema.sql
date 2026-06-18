-- Run this in your Supabase SQL Editor to set up the database.
-- Safe to re-run — uses IF NOT EXISTS / OR REPLACE.

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'new',
  payment_method TEXT DEFAULT 'card',
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
  shipped_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint auto-creates index; drop redundant explicit index
DROP INDEX IF EXISTS idx_orders_order_id;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 99,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_stock_nonnegative CHECK (stock >= 0)
);

DROP INDEX IF EXISTS idx_inventory_slug;

-- Atomic stock decrease: INSERTs product row if missing, then atomically decreases stock.
-- RAISEs if insufficient stock (caught by caller as Supabase error).
CREATE OR REPLACE FUNCTION decrease_stock(product_slug TEXT, qty INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO inventory (slug, name, stock)
  VALUES (product_slug, product_slug, 99)
  ON CONFLICT (slug) DO NOTHING;

  UPDATE inventory
  SET stock = stock - qty,
      updated_at = NOW()
  WHERE slug = product_slug AND stock >= qty;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for %', product_slug;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row-Level Security (bypassed by service_role key used in functions)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- DO NOT CREATE POLICIES — service_role bypasses RLS.
-- Anon/authenticated keys get empty result sets (intentional).
