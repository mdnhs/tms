import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getShopId } from '@/lib/get-shop';
import { getGlobalSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const preferredRegion = 'sin1';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getGlobalSupabase();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .select('id, name')
    .eq('id', shopId)
    .maybeSingle();
  if (shopError) return NextResponse.json({ error: shopError.message }, { status: 500 });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const [customers, products, categories, orders, orderHistory, staff, roles, settingsRow] = await Promise.all([
    supabase.from('customers').select('*').eq('shop_id', shopId),
    supabase.from('products').select('*').eq('shop_id', shopId),
    supabase.from('categories').select('*').eq('shop_id', shopId),
    supabase.from('orders').select('*').eq('shop_id', shopId),
    supabase.from('order_history').select('*').eq('shop_id', shopId),
    supabase.from('shop_staff').select('id, shop_id, name, phone, role, role_id, is_active, salary_amount, created_at').eq('shop_id', shopId),
    supabase.from('shop_roles').select('*').eq('shop_id', shopId),
    supabase.from('shop_settings').select('data').eq('shop_id', shopId).maybeSingle(),
  ]);

  const exportErrors = [
    customers.error,
    products.error,
    categories.error,
    orders.error,
    orderHistory.error,
    staff.error,
    roles.error,
    settingsRow.error,
  ].filter(Boolean);

  if (exportErrors.length > 0) {
    return NextResponse.json(
      { error: exportErrors[0]!.message || 'Failed to export data' },
      { status: 500 },
    );
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    shopId,
    shopName: shop.name,
    data: {
      customers: customers.data || [],
      products: products.data || [],
      categories: categories.data || [],
      orders: orders.data || [],
      orderHistory: orderHistory.data || [],
      staff: staff.data || [],
      roles: roles.data || [],
      settings: settingsRow.data?.data || {},
    },
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="shop-backup-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
}
