import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGlobalSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getGlobalSupabase()!;
  const { data: shop } = await supabase
    .from('shops')
    .select('id, name')
    .eq('owner_id', session.user.id)
    .limit(1)
    .single();
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const shopId = shop.id;

  const [customers, products, categories, orders, orderHistory, staff, roles, settingsRow] = await Promise.all([
    supabase.from('customers').select('*').eq('shop_id', shopId),
    supabase.from('products').select('*').eq('shop_id', shopId),
    supabase.from('categories').select('*').eq('shop_id', shopId),
    supabase.from('orders').select('*').eq('shop_id', shopId),
    supabase.from('order_history').select('*').eq('shop_id', shopId),
    supabase.from('shop_staff').select('id, shop_id, name, phone, role, role_id, is_active, salary_amount, created_at').eq('shop_id', shopId),
    supabase.from('shop_roles').select('*').eq('shop_id', shopId),
    supabase.from('shop_settings').select('data').eq('shop_id', shopId).single(),
  ]);

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
