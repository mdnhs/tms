import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGlobalSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const supabase = getGlobalSupabase()!;

  // Check if owner
  const { data: shop } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', userId)
    .limit(1)
    .single();

  if (shop) {
    const { data: staff } = await supabase
      .from('shop_staff')
      .select('id, name, phone, role, is_active')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: true });
    return NextResponse.json({
      userType: 'owner',
      shopId: shop.id,
      permissions: {},
      staffList: (staff || []).map((s: any) => ({ id: s.id, name: s.name, phone: s.phone || undefined, role: s.role, isActive: Boolean(s.is_active) })),
    });
  }

  // Check if staff
  const { data: staffRecord } = await supabase
    .from('shop_staff')
    .select('id, name, shop_id, role_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!staffRecord) {
    return NextResponse.json({ userType: 'owner', shopId: null, permissions: {}, staffList: [] });
  }

  let permissions: Record<string, string[]> = {};
  if (staffRecord.role_id) {
    const { data: role } = await supabase
      .from('shop_roles')
      .select('permissions')
      .eq('id', staffRecord.role_id)
      .single();
    if (role?.permissions) permissions = role.permissions;
  }

  const { data: staffList } = await supabase
    .from('shop_staff')
    .select('id, name, phone, role, is_active')
    .eq('shop_id', staffRecord.shop_id)
    .order('created_at', { ascending: true });

  return NextResponse.json({
    userType: 'staff',
    shopId: staffRecord.shop_id,
    staffId: staffRecord.id,
    staffName: staffRecord.name,
    permissions,
    staffList: (staffList || []).map((s: any) => ({ id: s.id, name: s.name, phone: s.phone || undefined, role: s.role, isActive: Boolean(s.is_active) })),
  });
}
