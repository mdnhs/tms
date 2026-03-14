import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { genId } from '@/lib/get-shop';
import { getGlobalSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const preferredRegion = 'sin1';

const DEFAULT_SETTINGS = {
  shopName: 'My Tailor Shop',
  shopNameBn: 'আমার টেইলার শপ',
  shopAddress: '',
  shopPhone: '',
  shopLogo: '',
  currency: '৳',
  invoicePrefix: 'INV-',
  defaultAdvancePercent: 50,
  enablePrintAutoOpen: false,
  enableSMS: false,
  smsApiKey: '',
  smsSenderId: '',
  smsBalanceThreshold: 50,
};

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getGlobalSupabase()!;
  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', session.user.id)
    .limit(1)
    .single();
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const shopId = shop.id;
  const { data: existing } = await supabase
    .from('shop_settings')
    .select('id')
    .eq('shop_id', shopId)
    .single();

  if (existing) {
    await supabase
      .from('shop_settings')
      .update({ data: DEFAULT_SETTINGS, updated_at: new Date().toISOString() })
      .eq('shop_id', shopId);
  } else {
    await supabase.from('shop_settings').insert({
      id: genId(),
      shop_id: shopId,
      data: DEFAULT_SETTINGS,
      updated_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
}
