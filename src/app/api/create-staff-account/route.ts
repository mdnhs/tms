import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGlobalSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { email, password, staffId, shopId } = await req.json();
  if (!email || !password || !staffId || !shopId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = getGlobalSupabase()!;

  // Verify the requester owns the shop
  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('id', shopId)
    .eq('owner_id', session.user.id)
    .limit(1)
    .single();
  if (!shop) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Verify the staff record belongs to this shop
  const { data: staffRecord } = await supabase
    .from('shop_staff')
    .select('id')
    .eq('id', staffId)
    .eq('shop_id', shopId)
    .limit(1)
    .single();
  if (!staffRecord) return NextResponse.json({ error: 'Staff not found' }, { status: 404 });

  try {
    const result = await auth.api.signUpEmail({
      body: { email, password, name: '' },
    });
    if (!result || !result.user) {
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
    await supabase
      .from('shop_staff')
      .update({ user_id: result.user.id })
      .eq('id', staffId);
    return NextResponse.json({ success: true, userId: result.user.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create account' }, { status: 400 });
  }
}
