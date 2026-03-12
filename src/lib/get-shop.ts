import { getGlobalSupabase } from './supabase';

const SHOP_ID_CACHE_TTL_MS = 5 * 60 * 1000;
const shopIdCache = new Map<string, { shopId: string | null; expiresAt: number }>();

async function inferOwnerShopId(): Promise<string | null> {
  const supabase = getGlobalSupabase();
  if (!supabase) return null;

  const settingsResult = await supabase
    .from('shop_settings')
    .select('shop_id, updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (settingsResult.data?.shop_id) return settingsResult.data.shop_id;

  const ordersResult = await supabase
    .from('orders')
    .select('shop_id, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (ordersResult.data?.shop_id) return ordersResult.data.shop_id;

  const customersResult = await supabase
    .from('customers')
    .select('shop_id, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (customersResult.data?.shop_id) return customersResult.data.shop_id;

  return null;
}

/**
 * Get shopId for a user via Supabase.
 */
export async function getShopId(userId: string): Promise<string | null> {
  const supabase = getGlobalSupabase();
  if (!supabase) throw new Error('Supabase not configured');

  const cached = shopIdCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.shopId;
  }

  // Check if user owns a shop
  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();
  if (shop) {
    shopIdCache.set(userId, { shopId: shop.id, expiresAt: Date.now() + SHOP_ID_CACHE_TTL_MS });
    return shop.id;
  }

  // Check if user is staff
  const { data: staff } = await supabase
    .from('shop_staff')
    .select('shop_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (staff?.shop_id) {
    shopIdCache.set(userId, { shopId: staff.shop_id, expiresAt: Date.now() + SHOP_ID_CACHE_TTL_MS });
    return staff.shop_id;
  }

  // Fallback for older databases where business data exists but shops mapping is missing.
  const inferredShopId = await inferOwnerShopId();
  shopIdCache.set(userId, { shopId: inferredShopId, expiresAt: Date.now() + SHOP_ID_CACHE_TTL_MS });
  return inferredShopId;
}

/**
 * Generate a unique ID.
 */
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
