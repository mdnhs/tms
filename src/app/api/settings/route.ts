import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getShopId, genId, setShopIdCache } from '@/lib/get-shop';
import { getGlobalSupabase } from '@/lib/supabase';
import { BANGLADESH_MOBILE_ERROR, normalizeBangladeshMobile } from '@/lib/bd-phone';

export const runtime = 'nodejs';
export const preferredRegion = 'sin1';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ settings: null });
  const shopId = await getShopId(session.user.id);
  if (!shopId) return NextResponse.json({ settings: null });

  const supabase = getGlobalSupabase()!;
  const { data: row } = await supabase
    .from('shop_settings')
    .select('data')
    .eq('shop_id', shopId)
    .single();
  return NextResponse.json({ settings: row?.data || null });
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let shopId = await getShopId(session.user.id);

  const settings = await req.json();
  const shopPhone = typeof settings?.shopPhone === 'string' ? settings.shopPhone.trim() : '';
  const normalizedShopPhone = shopPhone ? normalizeBangladeshMobile(shopPhone) : '';
  if (shopPhone && !normalizedShopPhone) {
    return NextResponse.json({ error: BANGLADESH_MOBILE_ERROR }, { status: 400 });
  }
  const nextSettings = { ...settings, shopPhone: normalizedShopPhone || '' };
  const supabase = getGlobalSupabase()!;

  if (!shopId) {
    const id = genId();
    await supabase.from('shops').insert({
      id,
      owner_id: session.user.id,
      name: 'My Shop',
      created_at: new Date().toISOString(),
    });
    shopId = id;
    setShopIdCache(session.user.id, shopId);
  }

  const { data: existing } = await supabase
    .from('shop_settings')
    .select('id')
    .eq('shop_id', shopId)
    .single();
  if (existing) {
    await supabase
      .from('shop_settings')
      .update({ data: nextSettings, updated_at: new Date().toISOString() })
      .eq('shop_id', shopId);
  } else {
    await supabase.from('shop_settings').insert({
      id: genId(),
      shop_id: shopId,
      data: nextSettings,
    });
  }
  return NextResponse.json({ success: true });
}
