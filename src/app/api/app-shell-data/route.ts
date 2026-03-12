import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudDb } from '@/lib/cloud-db';
import { getShopId } from '@/lib/get-shop';
export { runtime, preferredRegion } from '@/lib/vercel-runtime';

interface StaffListRow {
  id: string;
  name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
}

interface CurrentStaffRow {
  id: string;
  name: string;
  role_id: string | null;
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = await getShopId(session.user.id);
  if (!shopId) {
    return NextResponse.json({
      userType: 'owner',
      staffId: null,
      staffName: null,
      staffPermissions: {},
      staffList: [],
      settings: null,
      notificationCounts: { pending: 0, due: 0, ready: 0 },
    }, {
      headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' },
    });
  }

  const cloud = getCloudDb(shopId);
  const [
    currentStaffResult,
    staffListResult,
    settingsResult,
    pendingCountResult,
    dueCountResult,
    readyCountResult,
  ] = await Promise.all([
    cloud
      .from('shop_staff')
      .select('id, name, role_id')
      .eq('shop_id', shopId)
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle(),
    cloud
      .from('shop_staff')
      .select('id, name, phone, role, is_active')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: true }),
    cloud
      .from('shop_settings')
      .select('data')
      .eq('shop_id', shopId)
      .maybeSingle(),
    cloud
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .eq('status', 'pending'),
    cloud
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .gt('due_amount', 0)
      .neq('status', 'delivered'),
    cloud
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .eq('status', 'ready'),
  ]);

  const firstError =
    currentStaffResult.error ||
    staffListResult.error ||
    settingsResult.error ||
    pendingCountResult.error ||
    dueCountResult.error ||
    readyCountResult.error;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  let staffPermissions: Record<string, string[]> = {};
  const currentStaff = currentStaffResult.data as CurrentStaffRow | null;

  if (currentStaff?.role_id) {
    const roleResult = await cloud
      .from('shop_roles')
      .select('permissions')
      .eq('shop_id', shopId)
      .eq('id', currentStaff.role_id)
      .maybeSingle();

    if (roleResult.error) {
      return NextResponse.json({ error: roleResult.error.message }, { status: 500 });
    }

    if (roleResult.data?.permissions && typeof roleResult.data.permissions === 'object' && !Array.isArray(roleResult.data.permissions)) {
      staffPermissions = roleResult.data.permissions as Record<string, string[]>;
    }
  }

  return NextResponse.json({
    userType: currentStaff ? 'staff' : 'owner',
    staffId: currentStaff?.id || null,
    staffName: currentStaff?.name || null,
    staffPermissions,
    staffList: ((staffListResult.data || []) as StaffListRow[]).map((staff) => ({
      id: staff.id,
      name: staff.name,
      phone: staff.phone || undefined,
      role: staff.role,
      isActive: Boolean(staff.is_active),
    })),
    settings: settingsResult.data?.data || null,
    notificationCounts: {
      pending: pendingCountResult.count || 0,
      due: dueCountResult.count || 0,
      ready: readyCountResult.count || 0,
    },
  }, {
    headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' },
  });
}
