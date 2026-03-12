import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudDb } from '@/lib/cloud-db';
import { getShopId } from '@/lib/get-shop';
export { runtime, preferredRegion } from '@/lib/vercel-runtime';

interface StaffRow {
  id: string;
  name: string;
  phone: string;
  role: string;
  role_id: string | null;
  user_id: string | null;
  is_active: boolean;
  salary_amount: number;
  shop_id: string;
  created_at: string;
}

interface RoleRow {
  id: string;
  name: string;
  name_bn: string;
  permissions: unknown;
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = await getShopId(session.user.id);
  if (!shopId) {
    return NextResponse.json(
      { shopId: null, staff: [], roles: [] },
      { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' } },
    );
  }

  const cloud = getCloudDb(shopId);
  const [staffResult, rolesResult] = await Promise.all([
    cloud
      .from('shop_staff')
      .select('id, name, phone, role, role_id, user_id, is_active, salary_amount, shop_id, created_at')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: true }),
    cloud.from('shop_roles').select('id, name, name_bn, permissions').eq('shop_id', shopId).order('created_at', { ascending: true }),
  ]);

  const firstError = staffResult.error || rolesResult.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      shopId,
      staff: (staffResult.data || []) as StaffRow[],
      roles: (rolesResult.data || []) as RoleRow[],
    },
    { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' } },
  );
}
