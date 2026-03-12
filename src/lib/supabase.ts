import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client from the given credentials.
 * Uses service role key if available (bypasses RLS), else anon key.
 */
export function createSupabaseClient(
  url: string,
  anonKey: string,
  serviceRoleKey?: string,
): SupabaseClient {
  return createClient(url, serviceRoleKey || anonKey, {
    auth: { persistSession: false },
  });
}

let _globalClient: SupabaseClient | null = null;

/**
 * Global Supabase client from env vars.
 * Returns null if env vars are not set.
 */
export function getGlobalSupabase(): SupabaseClient | null {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  if (!_globalClient) {
    _globalClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return _globalClient;
}

/** SQL for creating business tables in Supabase */
export const SUPABASE_SETUP_SQL = `
-- Shops
CREATE TABLE IF NOT EXISTS shops (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Shop',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(shop_id, name)
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  notes TEXT,
  photo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_shop ON customers(shop_id);
CREATE INDEX IF NOT EXISTS idx_customers_shop_created_at ON customers(shop_id, created_at DESC);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  base_price NUMERIC NOT NULL DEFAULT 0,
  measurement_fields JSONB NOT NULL DEFAULT '[]',
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_shop ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_created_at ON products(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_shop_category ON products(shop_id, category);

-- Shop roles
CREATE TABLE IF NOT EXISTS shop_roles (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  name TEXT NOT NULL,
  name_bn TEXT NOT NULL DEFAULT '',
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shop_roles_shop ON shop_roles(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_roles_shop_created_at ON shop_roles(shop_id, created_at DESC);

-- Shop staff
CREATE TABLE IF NOT EXISTS shop_staff (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  user_id TEXT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  role_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  salary_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shop_staff_shop ON shop_staff(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_staff_shop_created_at ON shop_staff(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_staff_user_active ON shop_staff(user_id, is_active);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  product_id TEXT NOT NULL DEFAULT '',
  measurements JSONB NOT NULL DEFAULT '[]',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  advance_paid NUMERIC NOT NULL DEFAULT 0,
  due_amount NUMERIC NOT NULL DEFAULT 0,
  delivery_date TEXT NOT NULL DEFAULT '',
  special_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  items JSONB
);
CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_created_at ON orders(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shop_customer ON orders(shop_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_status ON orders(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_shop_assigned_to ON orders(shop_id, assigned_to);

-- Order history
CREATE TABLE IF NOT EXISTS order_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  shop_id TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  performed_by TEXT,
  changes JSONB,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_history_shop ON order_history(shop_id);
CREATE INDEX IF NOT EXISTS idx_order_history_shop_timestamp ON order_history(shop_id, "timestamp" DESC);

-- Shop settings
CREATE TABLE IF NOT EXISTS shop_settings (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_updated_at ON shop_settings(shop_id, updated_at DESC);
`;
