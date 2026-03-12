import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGlobalSupabase } from '@/lib/supabase';

// scope: 'orders' | 'customers' | 'products' | 'staff' | 'all'
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { scope } = await req.json() as { scope: string };
  const validScopes = ['orders', 'customers', 'products', 'staff', 'all'];
  if (!validScopes.includes(scope)) {
    return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
  }

  const supabase = getGlobalSupabase()!;
  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', session.user.id)
    .limit(1)
    .single();
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const shopId = shop.id;

  if (scope === 'orders' || scope === 'all') {
    await supabase.from('order_history').delete().eq('shop_id', shopId);
    await supabase.from('orders').delete().eq('shop_id', shopId);
  }
  if (scope === 'customers' || scope === 'all') {
    await supabase.from('customers').delete().eq('shop_id', shopId);
  }
  if (scope === 'products' || scope === 'all') {
    await supabase.from('products').delete().eq('shop_id', shopId);
    await supabase.from('categories').delete().eq('shop_id', shopId);
  }
  if (scope === 'staff' || scope === 'all') {
    await supabase.from('shop_staff').delete().eq('shop_id', shopId);
    await supabase.from('shop_roles').delete().eq('shop_id', shopId);
  }

  return NextResponse.json({ success: true, scope });
}
