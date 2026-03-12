import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sql = `
CREATE INDEX IF NOT EXISTS idx_customers_shop_created_at ON customers(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_shop_created_at ON products(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_shop_category ON products(shop_id, category);
CREATE INDEX IF NOT EXISTS idx_shop_roles_shop_created_at ON shop_roles(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_staff_shop_created_at ON shop_staff(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_staff_user_active ON shop_staff(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_orders_shop_created_at ON orders(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_shop_customer ON orders(shop_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_status ON orders(shop_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_shop_assigned_to ON orders(shop_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_order_history_shop_timestamp ON order_history(shop_id, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_shop_settings_shop_updated_at ON shop_settings(shop_id, updated_at DESC);
`;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Supabase performance indexes are ready.");
} finally {
  await client.end().catch(() => {});
}
