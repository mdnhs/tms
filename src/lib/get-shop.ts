import { getGlobalSupabase } from './supabase';

const SHOP_ID_CACHE_TTL_MS = 5 * 60 * 1000;
const shopIdCache = new Map<string, { shopId: string | null; expiresAt: number }>();

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
  const [shopResult, staffResult] = await Promise.all([
    supabase
      .from('shops')
      .select('id')
      .eq('owner_id', userId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('shop_staff')
      .select('shop_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle(),
  ]);

  const shop = shopResult.data;
  if (shop) {
    shopIdCache.set(userId, { shopId: shop.id, expiresAt: Date.now() + SHOP_ID_CACHE_TTL_MS });
    return shop.id;
  }

  const staff = staffResult.data;
  if (staff?.shop_id) {
    shopIdCache.set(userId, { shopId: staff.shop_id, expiresAt: Date.now() + SHOP_ID_CACHE_TTL_MS });
    return staff.shop_id;
  }

  // No shop found — don't cache null so the next request re-checks
  return null;
}

/**
 * Immediately update the cache for a user (e.g. after creating a new shop).
 */
export function setShopIdCache(userId: string, shopId: string): void {
  shopIdCache.set(userId, { shopId, expiresAt: Date.now() + SHOP_ID_CACHE_TTL_MS });
}

/**
 * Generate a unique ID.
 */
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
