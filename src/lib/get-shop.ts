import { getGlobalSupabase } from './supabase';

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

  // Check if user owns a shop
  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();
  if (shop) return shop.id;

  // Check if user is staff
  const { data: staff } = await supabase
    .from('shop_staff')
    .select('shop_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (staff?.shop_id) return staff.shop_id;

  // Fallback for older databases where business data exists but shops mapping is missing.
  return inferOwnerShopId();
}

/**
 * Generate a unique ID.
 */
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
