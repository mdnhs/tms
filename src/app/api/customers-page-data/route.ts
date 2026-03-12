import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCloudDb } from '@/lib/cloud-db';
import { getShopId } from '@/lib/get-shop';

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes: string | null;
  photo: string | null;
  created_at: string;
}

interface OrderRow {
  id: string;
  customer_id: string;
  total_price: number;
  status: string;
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = await getShopId(session.user.id);
  if (!shopId) {
    return NextResponse.json({ customers: [], orders: [] }, { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' } });
  }

  const cloud = getCloudDb(shopId);
  const [customersResult, ordersResult] = await Promise.all([
    cloud.from('customers').select('id, name, phone, address, notes, photo, created_at').eq('shop_id', shopId).order('created_at', { ascending: false }),
    cloud.from('orders').select('id, customer_id, total_price, status').eq('shop_id', shopId),
  ]);

  const firstError = customersResult.error || ordersResult.error;
  if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

  const customers = ((customersResult.data || []) as CustomerRow[]).map(row => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    notes: row.notes || undefined,
    photo: row.photo || undefined,
    createdAt: row.created_at,
  }));

  const orders = ((ordersResult.data || []) as OrderRow[]).map(row => ({
    id: row.id,
    customerId: row.customer_id,
    totalPrice: row.total_price,
    status: row.status,
  }));

  return NextResponse.json({ customers, orders }, { headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=20' } });
}
