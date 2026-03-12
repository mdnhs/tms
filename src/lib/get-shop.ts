import { getGlobalSupabase } from './supabase';

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
    .single();
  if (shop) return shop.id;

  // Check if user is staff
  const { data: staff } = await supabase
    .from('shop_staff')
    .select('shop_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .single();
  return staff?.shop_id || null;
}

/**
 * Generate a unique ID.
 */
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
