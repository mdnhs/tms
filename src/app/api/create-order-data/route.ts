import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudDb } from '@/lib/cloud-db';
import { getShopId } from '@/lib/get-shop';

export const runtime = 'nodejs';
export const preferredRegion = 'sin1';

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string | null;
  photo: string | null;
  created_at: string;
}

interface ProductRow {
  id: string;
  name: string;
  name_bn: string;
  category: string;
  base_price: number;
  image: string | null;
  measurement_fields: Array<{
    id: string;
    name: string;
    nameBn: string;
  }> | null;
}

interface StaffRow {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shopId = await getShopId(session.user.id);
  if (!shopId) {
    return NextResponse.json(
      { customers: [], products: [], staff: [] },
      { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' } },
    );
  }

  const cloud = getCloudDb(shopId);
  const [customersResult, productsResult, staffResult] = await Promise.all([
    cloud
      .from('customers')
      .select('id, name, phone, address, notes, photo, created_at')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false }),
    cloud
      .from('products')
      .select('id, name, name_bn, category, base_price, image, measurement_fields')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: true }),
    cloud
      .from('shop_staff')
      .select('id, name, role, is_active')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: true }),
  ]);

  const firstError = customersResult.error || productsResult.error || staffResult.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const customers = ((customersResult.data || []) as CustomerRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    notes: row.notes ?? undefined,
    photo: row.photo ?? undefined,
    createdAt: row.created_at,
  }));

  const products = ((productsResult.data || []) as ProductRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    nameBn: row.name_bn,
    category: row.category,
    basePrice: row.base_price,
    image: row.image ?? undefined,
    measurementFields: row.measurement_fields || [],
  }));

  const staff = ((staffResult.data || []) as StaffRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    isActive: Boolean(row.is_active),
  }));

  return NextResponse.json(
    { customers, products, staff },
    { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' } },
  );
}
